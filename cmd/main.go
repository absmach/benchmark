package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"math/rand"
	"os"
	"reflect"
	"time"

	"github.com/0x6flab/namegenerator"
	"github.com/caarlos0/env/v9"
	sdk "github.com/mainflux/mainflux/pkg/sdk/go"
)

type config struct {
	AdminIdentity    string `env:"MF_BENCH_ADMIN_IDENTITY"           envDefault:"admin@example.com"`
	AdminSecret      string `env:"MF_BENCH_ADMIN_SECRET"             envDefault:"12345678"`
	DefPass          string `env:"MF_BENCH_DEF_PASS"                 envDefault:"12345678"`
	UsersURL         string `env:"MF_BENCH_USERS_URL"                envDefault:""`
	ThingsURL        string `env:"MF_BENCH_THINGS_URL"               envDefault:""`
	SeedNumber       int    `env:"MF_BENCH_SEED_NUMBER"              envDefault:"10"`
	MsgNumber        int    `env:"MF_BENCH_MESSAGING_NUMBER"         envDefault:"50"`
	JSONSeedFilePath string `env:"MF_BENCH_SEED_JSON_FILE_PATH"      envDefault:"./k6/scripts/data.json"`
	JSONMsgFilePath  string `env:"MF_BENCH_MESSAGING_JSON_FILE_PATH" envDefault:"./k6/scripts/messaging.json"`
}

const (
	// seedingOperation is used to seed the database with users, groups, things, channels and policies.
	// This is used to test HTTP API.
	seedingOperation int = iota
	// messagingOperation is used to seed the database with things and channels.
	// This is used to test protocol adapters.
	messagingOperation
)

var (
	namegen                    = namegenerator.NewNameGenerator("")
	usersPolicies              = []string{"c_list", "c_update", "c_delete", "g_add", "g_list", "g_update", "g_delete"}
	thingsPolicies             = []string{"m_read", "m_write"}
	defItems                   = 10
	filePermision  fs.FileMode = 0644
)

func init() {
	rand.New(rand.NewSource(time.Now().UnixNano()))
}

func main() {
	cfg := config{}
	if err := env.Parse(&cfg); err != nil {
		log.Fatalf("failed to parse config: %s", err.Error())
	}

	var operation int
	flag.IntVar(&operation, "operation", seedingOperation, "operation to perform. 0 - seeding, 1 - messaging")
	flag.Parse()

	var conf = sdk.Config{
		UsersURL:  cfg.UsersURL,
		ThingsURL: cfg.ThingsURL,
	}
	mfsdk := sdk.NewSDK(conf)

	// Login using admin credentials
	var user = sdk.User{
		Credentials: sdk.Credentials{
			Identity: cfg.AdminIdentity,
			Secret:   cfg.AdminSecret,
		},
	}
	adminToken, err := mfsdk.CreateToken(user)
	if err != nil {
		log.Fatalf("failed to login: %s", err.Error())
	}

	switch operation {
	case seedingOperation:
		// Create users using admin credentials
		users, err1 := createUsers(mfsdk, adminToken, cfg)
		if err1 != nil {
			log.Fatalf("failed to create users: %s", err1.Error())
		}

		// Create groups using admin credentials
		groups, err1 := createGroups(mfsdk, adminToken, cfg)
		if err1 != nil {
			log.Fatalf("failed to create groups: %s", err1.Error())
		}

		// Create user policies using admin credentials
		if err := createUsersPolicies(mfsdk, adminToken, users, groups); err != nil {
			log.Fatalf("failed to create users policies: %s", err.Error())
		}

		// Create things using admin credentials
		things, err1 := createThings(mfsdk, adminToken, cfg.SeedNumber)
		if err1 != nil {
			log.Fatalf("failed to create things: %s", err1.Error())
		}

		// Create channels using admin credentials
		channels, err1 := createChannels(mfsdk, adminToken, cfg.SeedNumber)
		if err1 != nil {
			log.Fatalf("failed to create channels: %s", err1.Error())
		}

		// Create thing policies using admin credentials
		if err := createThingsPolicies(mfsdk, adminToken, things, channels); err != nil {
			log.Fatalf("failed to create things policies: %s", err.Error())
		}

		// Write data to file
		var data = map[string]interface{}{
			"users":    genIDs(users),
			"groups":   genIDs(groups),
			"things":   genIDs(things),
			"channels": genIDs(channels),
		}
		if err := writeToJSONFile(data, cfg.JSONSeedFilePath); err != nil {
			log.Fatalf("failed to write data to file: %s", err.Error())
		}
	case messagingOperation:
		// Create things using admin credentials
		things, err1 := createThings(mfsdk, adminToken, cfg.MsgNumber)
		if err1 != nil {
			log.Fatalf("failed to create things: %s", err1.Error())
		}

		// Create channels using admin credentials
		channels, err1 := createChannels(mfsdk, adminToken, cfg.MsgNumber)
		if err1 != nil {
			log.Fatalf("failed to create channels: %s", err1.Error())
		}

		// Create thing policies using admin credentials
		if err := createThingsPolicies(mfsdk, adminToken, things, channels); err != nil {
			log.Fatalf("failed to create things policies: %s", err.Error())
		}

		// Write data to file
		var data = map[string]interface{}{
			"things":   genThingCredentials(things),
			"channels": genIDs(channels),
		}
		if err := writeToJSONFile(data, cfg.JSONMsgFilePath); err != nil {
			log.Fatalf("failed to write data to file: %s", err.Error())
		}
	default:
		log.Fatalf("invalid operation: %d", operation)
	}

}

func createUsers(mfsdk sdk.SDK, token sdk.Token, cfg config) ([]sdk.User, error) {
	var users []sdk.User
	for i := 0; i < cfg.SeedNumber; i++ {
		name := namegen.Generate()
		user := sdk.User{
			Name: name,
			Credentials: sdk.Credentials{
				Identity: fmt.Sprintf("%s@mainflux.com", name),
				Secret:   cfg.DefPass,
			},
			Metadata: generateMetadata(),
		}
		user, err := mfsdk.CreateUser(user, token.AccessToken)
		if err != nil {
			return nil, fmt.Errorf("failed to create user %+v: %s", user, err.Error())
		}
		users = append(users, user)
	}

	return users, nil
}

func createGroups(mfsdk sdk.SDK, token sdk.Token, cfg config) ([]sdk.Group, error) {
	var groups []sdk.Group
	var parentID string
	for i := 0; i < cfg.SeedNumber; i++ {
		group := sdk.Group{
			Name:        namegen.Generate(),
			Description: fmt.Sprintf("Group %d", i),
			ParentID:    parentID,
			Metadata:    generateMetadata(),
		}
		group, err := mfsdk.CreateGroup(group, token.AccessToken)
		if err != nil {
			return nil, fmt.Errorf("failed to create group %+v: %s", group, err.Error())
		}
		groups = append(groups, group)
		parentID = group.ID
	}

	return groups, nil
}

func createUsersPolicies(mfsdk sdk.SDK, token sdk.Token, users []sdk.User, groups []sdk.Group) error {
	var totalPolicies = len(users) * len(groups) * len(usersPolicies)
	for i := 0; i < totalPolicies; i++ {
		policy := sdk.Policy{
			Subject: users[rand.Intn(len(users))].ID,
			Object:  groups[rand.Intn(len(groups))].ID,
			Actions: generatePolicies(usersPolicies),
		}
		if err := mfsdk.CreateUserPolicy(policy, token.AccessToken); err != nil {
			return fmt.Errorf("failed to create policy %+v: %s", policy, err.Error())
		}
	}

	return nil
}

func createThings(mfsdk sdk.SDK, token sdk.Token, number int) ([]sdk.Thing, error) {
	var things []sdk.Thing
	for i := 0; i < number; i++ {
		thing := sdk.Thing{
			Name:     namegen.Generate(),
			Tags:     namegen.GenerateNames(rand.Intn(number)),
			Metadata: generateMetadata(),
		}
		things = append(things, thing)
	}

	var thingsRes []sdk.Thing
	for i := 0; i < number; i += 90 {
		end := i + 90
		if end > number {
			end = number
		}
		batch := things[i:end]
		ths, err := mfsdk.CreateThings(batch, token.AccessToken)
		if err != nil {
			return nil, fmt.Errorf("failed to create things %+v: %s", batch, err.Error())
		}
		thingsRes = append(thingsRes, ths...)
	}

	return thingsRes, nil
}

func createChannels(mfsdk sdk.SDK, token sdk.Token, number int) ([]sdk.Channel, error) {
	var channels []sdk.Channel
	for i := 0; i < number; i++ {
		channel := sdk.Channel{
			Name:     namegen.Generate(),
			Metadata: generateMetadata(),
		}
		channels = append(channels, channel)
	}

	var channelsRes []sdk.Channel
	for i := 0; i < number; i += 90 {
		end := i + 90
		if end > number {
			end = number
		}
		batch := channels[i:end]
		chs, err := mfsdk.CreateChannels(batch, token.AccessToken)
		if err != nil {
			return nil, fmt.Errorf("failed to create channels %+v: %s", batch, err.Error())
		}
		channelsRes = append(channelsRes, chs...)
	}

	return channelsRes, nil
}

func createThingsPolicies(mfsdk sdk.SDK, token sdk.Token, things []sdk.Thing, channels []sdk.Channel) error {
	var connections = sdk.ConnectionIDs{
		ThingIDs:   genIDs(things),
		ChannelIDs: genIDs(channels),
		Actions:    thingsPolicies,
	}
	if err := mfsdk.Connect(connections, token.AccessToken); err != nil {
		return fmt.Errorf("failed to connect things and channels: %s", err.Error())
	}

	return nil
}

// generateMetadata generates random metadata.
func generateMetadata() map[string]interface{} {
	return map[string]interface{}{
		"type": namegen.Generate(),
		"location": map[string]interface{}{
			"latitude":  rand.Float64(),
			"longitude": rand.Float64(),
		},
		"maintainer": map[string]interface{}{
			"name":    namegen.Generate(),
			"address": "123 IoT Street, San Francisco, CA 94102",
			"model": map[string]interface{}{
				"name": namegen.Generate(),
				"tags": namegen.GenerateNames(rand.Intn(defItems)),
			},
		},
		"software": map[string]interface{}{
			"name":    namegen.Generate(),
			"version": fmt.Sprintf("v%d.%d.%d", rand.Intn(defItems), rand.Intn(defItems), rand.Intn(defItems)),
		},
		"status": rand.Intn(defItems) == defItems,
	}
}

// generatePolicies generates random number of policies from the provided slice.
func generatePolicies(policies []string) []string {
	var number = rand.Intn(len(policies))
	if number == 0 {
		number = 1
	}

	var pols = make([]string, number)
	for i := 0; i < number; i++ {
		pols[i] = policies[rand.Intn(len(policies))]
	}

	return pols
}

// genIDs generates slice of IDs from the provided slice of objects.
func genIDs(objs interface{}) []string {
	var v = reflect.ValueOf(objs)
	if v.Kind() != reflect.Slice {
		panic("objects argument must be a slice")
	}
	var ids = make([]string, v.Len())
	for i := 0; i < v.Len(); i++ {
		id := v.Index(i).FieldByName("ID").String()
		ids[i] = id
	}

	return ids
}

// genThingCredentials generates slice of credentials from the provided slice of things.
func genThingCredentials(objs interface{}) []map[string]string {
	var v = reflect.ValueOf(objs)
	if v.Kind() != reflect.Slice {
		panic("objects argument must be a slice")
	}
	var credentials = make([]map[string]string, v.Len())
	for i := 0; i < v.Len(); i++ {
		credentials[i] = map[string]string{
			"id":     v.Index(i).FieldByName("ID").String(),
			"secret": v.Index(i).FieldByName("Credentials").FieldByName("Secret").String(),
		}
	}

	return credentials
}

// writeToJSONFile writes data to JSON file.
func writeToJSONFile(data interface{}, filename string) error {
	file, err := json.MarshalIndent(data, "", " ")
	if err != nil {
		return err
	}

	return os.WriteFile(filename, file, filePermision)
}
