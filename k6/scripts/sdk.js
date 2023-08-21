import http from "k6/http";
import { check } from "k6";

const USERS_URL = __ENV.MF_BENCH_USERS_URL;
const THINGS_URL = __ENV.MF_BENCH_THINGS_URL;

const admin_identity = __ENV.MF_BENCH_ADMIN_IDENTITY;
const admin_secret = __ENV.MF_BENCH_ADMIN_SECRET;

const data = JSON.parse(open("./data.json"));

const parameters = ["status", "offset", "limit", "level", "metadata", "tag", "owner", "shared_by", "name", "email", "visibility", "action", "subject", "object"]
const user_actions = ["c_list", "c_update", "c_delete", "g_add", "g_list", "g_update", "g_delete"]
const messaging_actions = ["m_read", "m_write"]

function generateUUID() {
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    return uuid;
}

export function generate_query_params(domain) {
    let params = "?";
    for (let i = 0; i < parameters.length; i++) {
        let param = parameters[i];
        if (((param == "offset") || (param == "limit")) && (Math.random() < 0.5)) {
            let value = Math.floor(Math.random() * 100);
            if (value > 0) {
                params += param + "=" + value + "&";
            }
        } else if ((param == "level") && (Math.random() < 0.5) && (domain == "groups")) {
            params += param + "=" + Math.floor(Math.random() * 5) + "&";
        } else if ((param == "tag") && (Math.random() < 0.5) && (domain == "clients")) {
            params += param + "=" + "tag_" + Math.floor(Math.random() * 1000) + "&";
        } else if ((param == "status") && (Math.random() < 0.5)) {
            let values = ["enabled", "disabled"];
            params += param + "=" + values[Math.floor(Math.random() * values.length)] + "&";
        } else if ((param == "owner") && (Math.random() < 0.5)) {
            params += param + "=" + data.users[Math.floor(Math.random() * data.users.length)] + "&";
        } else if ((param == "shared_by") && (Math.random() < 0.5) && (domain == "clients")) {
            params += param + "=" + data.users[Math.floor(Math.random() * data.users.length)] + "&";
        } else if ((param == "name") && (Math.random() < 0.5)) {
            params += param + "=" + "test_client_" + Math.floor(Math.random() * 100) + "&";
        } else if ((param == "visibility") && (Math.random() < 0.5) && (domain == "clients")) {
            let values = ["mine", "shared", "all"];
            params += param + "=" + values[Math.floor(Math.random() * values.length)] + "&";
        } else if ((param == "action") && (Math.random() < 0.5) && (domain == "policies")) {
            params += param + "=" + messaging_actions[Math.floor(Math.random() * messaging_actions.length)] + "&";
        } else if ((param == "subject") && (Math.random() < 0.5) && (domain == "policies")) {
            let value = () => {
                if (Math.random() < 0.5) {
                    return data.users[Math.floor(Math.random() * data.users.length)];
                } else {
                    return data.things[Math.floor(Math.random() * data.things.length)];
                }
            }
            params += param + "=" + value() + "&";
        } else if ((param == "object") && (Math.random() < 0.5) && (domain == "policies")) {
            let value = () => {
                if (Math.random() < 0.5) {
                    return data.groups[Math.floor(Math.random() * data.groups.length)];
                } else {
                    return data.channels[Math.floor(Math.random() * data.channels.length)];
                }
            }
            params += param + "=" + value() + "&";
        }
    }

    return params;
}


export function getToken() {
    const payload = JSON.stringify({
        identity: admin_identity,
        secret: admin_secret,
    });

    const parameters = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    const res = http.post(USERS_URL + "/users/tokens/issue", payload, parameters);
    check(res, {
        "response code was 201": (res) => res.status == 201,
    });
    if (res.status != 201) {
        return "";
    } else {
        return res.json("access_token").toString();
    }
}

export function getParams() {
    return {
        headers: {
            Authorization: "Bearer " + getToken(),
            "Content-Type": "application/json",
        },
    };
}

export function generate_user_details() {
    return JSON.stringify({
        name: "test_client_" + Math.floor(Math.random() * 100),
        credentials: {
            identity: generateUUID() + "@example.com",
            secret: "12345678",
        },
    });
}

export function generate_thing_details(json) {
    const response = {
        name: "test_client_" + Math.floor(Math.random() * 100),
        metadata: {
            key1: "value_" + Math.floor(Math.random() * 1000),
            key2: "value_" + Math.floor(Math.random() * 1000),
        },
    };

    if (json == true) {
        return JSON.stringify(response);
    } else {
        return response;
    }
}

export function generate_group_details(json) {
    const response = {
        name: generateUUID(),
        description: "test_group_" + Math.floor(Math.random() * 100),
        metadata: {
            key1: "value_" + Math.floor(Math.random() * 1000),
            key2: "value_" + Math.floor(Math.random() * 1000),
        },
    };

    if (json) {
        return JSON.stringify(response);
    } else {
        return response;
    }
}

export function generate_tags() {
    return JSON.stringify({
        tags: [
            "tag_" + Math.floor(Math.random() * 1000),
            "tag_" + Math.floor(Math.random() * 1000),
        ],
    });
}

export function generate_name_metadata() {
    return JSON.stringify({
        name: "test_client_" + Math.floor(Math.random() * 100),
        metadata: {
            key1: "value_" + Math.floor(Math.random() * 1000),
            key2: "value_" + Math.floor(Math.random() * 1000),
        },
    });
}

export function get_users() {
    const res = http.get(USERS_URL + "/users" + generate_query_params("clients"), getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_profile() {
    const res = http.get(USERS_URL + "/users/profile", getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_user() {
    let user_id = data.users[Math.floor(Math.random() * data.users.length)];
    const res = http.get(USERS_URL + "/users/" + user_id, getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_memberships() {
    let user_id = data.users[Math.floor(Math.random() * data.users.length)];
    const res = http.get(USERS_URL + "/users/" + user_id + "/memberships" + generate_query_params("groups"), getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_user() {
    const payload = generate_name_metadata();

    let user_id = data.users[Math.floor(Math.random() * data.users.length)];
    const res = http.patch(USERS_URL + "/users/" + user_id, payload, getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_user_tags() {
    const payload = generate_tags();

    let user_id = data.users[Math.floor(Math.random() * data.users.length)];
    const res = http.patch(
        USERS_URL + "/users/" + user_id + "/tags",
        payload,
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_user_identity() {
    const payload = JSON.stringify({
        identity: generateUUID() + "@updatedexample.com",
    });

    let user_id = data.users[Math.floor(Math.random() * data.users.length)];
    const res = http.patch(
        USERS_URL + "/users/" + user_id + "/identity",
        payload,
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_user_owner() {
    const payload = JSON.stringify({
        owner: data.users[Math.floor(Math.random() * data.users.length)],
    });

    let user_id = data.users[Math.floor(Math.random() * data.users.length)];
    const res = http.patch(
        USERS_URL + "/users/" + user_id + "/owner",
        payload,
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_user_secret() {
    const payload = JSON.stringify({
        old_secret: admin_secret,
        new_secret: admin_secret,
    });

    const res = http.patch(USERS_URL + "/users/secret", payload, getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function create_user() {
    const payload = generate_user_details();

    const res = http.post(USERS_URL + "/users", payload, getParams());
    check(res, { "status was 201": (r) => r.status == 201 });
}

export function disable_user() {
    let user_id = data.users[Math.floor(Math.random() * data.users.length)];
    const res = http.post(
        USERS_URL + "/users/" + user_id + "/disable",
        null,
        getParams()
    );
    if (res.status != 200) {
        const res = http.post(
            USERS_URL + "/users/" + user_id + "/enable",
            null,
            getParams()
        );
        check(res, {
            "response code was 200": (res) => res.status == 200,
        });
    } else {
        check(res, {
            "response code was 200": (res) => res.status == 200,
        });
    }
}

export function enable_user() {
    let user_id = data.users[Math.floor(Math.random() * data.users.length)];
    const res = http.post(
        USERS_URL + "/users/" + user_id + "/enable",
        null,
        getParams()
    );

    if (res.status != 200) {
        const res = http.post(
            USERS_URL + "/users/" + user_id + "/disable",
            null,
            getParams()
        );
        check(res, {
            "response code was 200": (res) => res.status == 200,
        });
    } else {
        check(res, {
            "response code was 200": (res) => res.status == 200,
        });
    }
}

export function tokens() {
    const payload = JSON.stringify({
        identity: admin_identity,
        secret: admin_secret,
    });

    const params = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    const res = http.post(USERS_URL + "/users/tokens/issue", payload, params);
    check(res, {
        "response code was 201": (res) => res.status == 201,
    });

    if (res.status != 201) {
        return "";
    }

    params.headers.Authorization =
        "Bearer " + res.json("refresh_token").toString();

    const res1 = http.post(USERS_URL + "/users/tokens/refresh", payload, params);
    check(res1, {
        "response code was 201": (res1) => res1.status == 201,
    });
}

export function get_groups() {
    const res = http.get(USERS_URL + "/groups" + generate_query_params("groups"), getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_group() {
    let group_id = data.groups[Math.floor(Math.random() * data.groups.length)];
    const res = http.get(USERS_URL + "/groups/" + group_id, getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_group_children() {
    let group_id = data.groups[Math.floor(Math.random() * data.groups.length)];
    const res = http.get(USERS_URL + "/groups/" + group_id + "/children" + generate_query_params("groups"), getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_group_parents() {
    let group_id = data.groups[Math.floor(Math.random() * data.groups.length)];
    const res = http.get(USERS_URL + "/groups/" + group_id + "/parents" + generate_query_params("groups"), getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_group() {
    const payload = generate_group_details(true);

    let group_id = data.groups[Math.floor(Math.random() * data.groups.length)];
    const res = http.put(USERS_URL + "/groups/" + group_id, payload, getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function create_group() {
    const payload = generate_group_details(true);

    const res = http.post(USERS_URL + "/groups", payload, getParams());
    check(res, { "status was 201": (r) => r.status == 201 });
}

export function disable_group() {
    let group_id = data.groups[Math.floor(Math.random() * data.groups.length)];
    const res = http.post(
        USERS_URL + "/groups/" + group_id + "/disable",
        null,
        getParams()
    );

    if (res.status != 200) {
        const res = http.post(
            USERS_URL + "/groups/" + group_id + "/enable",
            null,
            getParams()
        );
        check(res, {
            "response code was 200": (res) => res.status == 200,
        });
    } else {
        check(res, {
            "response code was 200": (res) => res.status == 200,
        });
    }
}

export function enable_group() {
    let group_id = data.groups[Math.floor(Math.random() * data.groups.length)];
    const res = http.post(
        USERS_URL + "/groups/" + group_id + "/enable",
        null,
        getParams()
    );
    if (res.status != 200) {
        const res = http.post(
            USERS_URL + "/groups/" + group_id + "/disable",
            null,
            getParams()
        );
        check(res, {
            "response code was 200": (res) => res.status == 200,
        });
    } else {
        check(res, {
            "response code was 200": (res) => res.status == 200,
        });
    }
}

export function get_things() {
    const res = http.get(THINGS_URL + "/things" + generate_query_params("clients"), getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_thing() {
    let thing_id = data.things[Math.floor(Math.random() * data.things.length)];
    const res = http.get(THINGS_URL + "/things/" + thing_id, getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_thing_channels() {
    let thing_id = data.things[Math.floor(Math.random() * data.things.length)];
    const res = http.get(
        THINGS_URL + "/things/" + thing_id + "/channels" + generate_query_params("groups"),
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_thing() {
    const payload = generate_thing_details(true);

    let thing_id = data.things[Math.floor(Math.random() * data.things.length)];
    const res = http.patch(
        THINGS_URL + "/things/" + thing_id,
        payload,
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_thing_tags() {
    const payload = generate_tags();

    let thing_id = data.things[Math.floor(Math.random() * data.things.length)];
    const res = http.patch(
        THINGS_URL + "/things/" + thing_id + "/tags",
        payload,
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_thing_owner() {
    const payload = JSON.stringify({
        owner: data.users[Math.floor(Math.random() * data.users.length)],
    });

    let thing_id = data.things[Math.floor(Math.random() * data.things.length)];
    const res = http.patch(
        THINGS_URL + "/things/" + thing_id + "/owner",
        payload,
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_thing_secret() {
    const payload = JSON.stringify({
        secret: generateUUID(),
    });

    let thing_id = data.things[Math.floor(Math.random() * data.things.length)];
    const res = http.patch(
        THINGS_URL + "/things/" + thing_id + "/secret",
        payload,
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function create_thing() {
    const payload = generate_thing_details(true);

    const res = http.post(THINGS_URL + "/things", payload, getParams());
    check(res, { "status was 201": (r) => r.status == 201 });
}

export function create_things() {
    const payload = [];
    for (let i = 0; i < 10; i++) {
        const thing = generate_thing_details(false);

        payload.push(thing);
    }
    const data = JSON.stringify(payload);

    const res = http.post(THINGS_URL + "/things/bulk", data, getParams());
    check(res, { "status was 200": (r) => r.status == 200 });
}

export function disable_thing() {
    let thing_id = data.things[Math.floor(Math.random() * data.things.length)];
    const res = http.post(
        THINGS_URL + "/things/" + thing_id + "/disable",
        null,
        getParams()
    );

    if (res.status != 200) {
        const res = http.post(
            THINGS_URL + "/things/" + thing_id + "/enable",
            null,
            getParams()
        );
        check(res, { "response code was 200": (res) => res.status == 200 });
    } else {
        check(res, { "response code was 200": (res) => res.status == 200 });
    }
}

export function enable_thing() {
    let thing_id = data.things[Math.floor(Math.random() * data.things.length)];
    const res = http.post(
        THINGS_URL + "/things/" + thing_id + "/enable",
        null,
        getParams()
    );

    if (res.status != 200) {
        const res = http.post(
            THINGS_URL + "/things/" + thing_id + "/disable",
            null,
            getParams()
        );
        check(res, { "response code was 200": (res) => res.status == 200 });
    } else {
        check(res, { "response code was 200": (res) => res.status == 200 });
    }
}

export function get_channels() {
    const res = http.get(THINGS_URL + "/channels" + generate_query_params("groups"), getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_channel() {
    let channel_id =
        data.channels[Math.floor(Math.random() * data.channels.length)];
    const res = http.get(THINGS_URL + "/channels/" + channel_id, getParams());
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function get_channel_things() {
    let channel_id =
        data.channels[Math.floor(Math.random() * data.channels.length)];
    const res = http.get(
        THINGS_URL + "/channels/" + channel_id + "/things" + generate_query_params("clients"),
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function update_channel() {
    const payload = generate_group_details(true);

    let channel_id =
        data.channels[Math.floor(Math.random() * data.channels.length)];
    const res = http.put(
        THINGS_URL + "/channels/" + channel_id,
        payload,
        getParams()
    );
    check(res, { "response code was 200": (r) => r.status == 200 });
}

export function create_channel() {
    const payload = generate_group_details(true);

    const res = http.post(THINGS_URL + "/channels", payload, getParams());
    check(res, { "status was 201": (r) => r.status == 201 });
}

export function create_channels() {
    const payload = [];
    for (let i = 0; i < 10; i++) {
        const channel = generate_group_details(false);

        payload.push(channel);
    }
    const data = JSON.stringify(payload);

    const res = http.post(THINGS_URL + "/channels/bulk", data, getParams());
    check(res, { "status was 200": (r) => r.status == 200 });
}

export function disable_channel() {
    let channel_id =
        data.channels[Math.floor(Math.random() * data.channels.length)];
    const res = http.post(
        THINGS_URL + "/channels/" + channel_id + "/disable",
        null,
        getParams()
    );

    if (res.status != 200) {
        const res = http.post(
            THINGS_URL + "/channels/" + channel_id + "/enable",
            null,
            getParams()
        );
        check(res, { "response code was 200": (res) => res.status == 200 });
    } else {
        check(res, { "response code was 200": (res) => res.status == 200 });
    }
}

export function enable_channel() {
    let channel_id =
        data.channels[Math.floor(Math.random() * data.channels.length)];
    const res = http.post(
        THINGS_URL + "/channels/" + channel_id + "/enable",
        null,
        getParams()
    );
    if (res.status != 200) {
        const res = http.post(
            THINGS_URL + "/channels/" + channel_id + "/disable",
            null,
            getParams()
        );
        check(res, { "response code was 200": (res) => res.status == 200 });
    } else {
        check(res, { "response code was 200": (res) => res.status == 200 });
    }
}

export function crud_user_policies() {
    let actions = [];
    for (let i = 0; i < Math.floor(Math.random() * user_actions.length); i++) {
        actions.push(user_actions[Math.floor(Math.random() * user_actions.length)]);
    }
    if (actions.length == 0) {
        actions = user_actions;
    }
    let policy = {
        subject: data.users[Math.floor(Math.random() * data.users.length)],
        object: data.groups[Math.floor(Math.random() * data.groups.length)],
        actions: actions,
    };
    let res = http.post(USERS_URL + "/policies", JSON.stringify(policy), getParams());
    check(res, { "status was 201": (r) => r.status == 201 });

    res = http.get(USERS_URL + "/policies" + generate_query_params("policies"), getParams());
    check(res, { "status was 200": (r) => r.status == 200 });

    actions = [];
    for (let i = 0; i < Math.floor(Math.random() * user_actions.length); i++) {
        actions.push(user_actions[Math.floor(Math.random() * user_actions.length)]);
    }
    if (actions.length == 0) {
        actions = user_actions;
    }
    policy.actions = actions;
    res = http.put(USERS_URL + "/policies", JSON.stringify(policy), getParams());
    check(res, { "status was 204": (r) => r.status == 204 });

    res = http.get(USERS_URL + "/policies" + generate_query_params("policies"), getParams());
    check(res, { "status was 200": (r) => r.status == 200 });

    res = http.del(USERS_URL + "/policies/" + policy.subject + "/" + policy.object, null, getParams());
    check(res, { "status was 204": (r) => r.status == 204 });
}

export function create_user_policies() {
    let actions = [];
    for (let i = 0; i < Math.floor(Math.random() * user_actions.length); i++) {
        actions.push(user_actions[Math.floor(Math.random() * user_actions.length)]);
    }
    if (actions.length == 0) {
        actions = user_actions;
    }
    let policy = {
        subject: data.users[Math.floor(Math.random() * data.users.length)],
        object: data.groups[Math.floor(Math.random() * data.groups.length)],
        actions: actions,
    };
    let res = http.post(USERS_URL + "/policies", JSON.stringify(policy), getParams());
    check(res, { "status was 201": (r) => r.status == 201 });
}

export function crud_thing_policies() {
    let actions = [];
    for (let i = 0; i < Math.floor(Math.random() * messaging_actions.length); i++) {
        actions.push(messaging_actions[Math.floor(Math.random() * messaging_actions.length)]);
    }
    if (actions.length == 0) {
        actions = messaging_actions;
    }
    let policy_th_ch = {
        subject: data.things[Math.floor(Math.random() * data.things.length)],
        object: data.channels[Math.floor(Math.random() * data.channels.length)],
        actions: actions,
    };
    let res = http.post(THINGS_URL + "/policies", JSON.stringify(policy_th_ch), getParams());
    check(res, { "create status was 201": (r) => r.status == 201 });

    actions = [];
    for (let i = 0; i < Math.floor(Math.random() * user_actions.length); i++) {
        actions.push(user_actions[Math.floor(Math.random() * user_actions.length)]);
    }
    if (actions.length == 0) {
        actions = user_actions;
    }
    let policy_us_ch = {
        subject: data.users[Math.floor(Math.random() * data.users.length)],
        object: data.channels[Math.floor(Math.random() * data.channels.length)],
        actions: actions,
        external: true,
    };
    res = http.post(THINGS_URL + "/policies", JSON.stringify(policy_us_ch), getParams());
    check(res, { "create policies status was 201": (r) => r.status == 201 });

    res = http.get(THINGS_URL + "/policies" + generate_query_params("policies"), getParams());
    check(res, { "get policies status was 200": (r) => r.status == 200 });

    res = http.del(THINGS_URL + "/policies/" + policy_th_ch.subject + "/" + policy_th_ch.object, null, getParams());
    check(res, { "status was 204": (r) => r.status == 204 });

    res = http.del(THINGS_URL + "/policies/" + policy_us_ch.subject + "/" + policy_us_ch.object, null, getParams());
    check(res, { "status was 204": (r) => r.status == 204 });
}

export function create_thing_policies() {
    let actions = [];
    for (let i = 0; i < Math.floor(Math.random() * messaging_actions.length); i++) {
        actions.push(messaging_actions[Math.floor(Math.random() * messaging_actions.length)]);
    }
    if (actions.length == 0) {
        actions = messaging_actions;
    }
    let policy = {
        subject: data.things[Math.floor(Math.random() * data.things.length)],
        object: data.channels[Math.floor(Math.random() * data.channels.length)],
        actions: actions,
    };
    let res = http.post(THINGS_URL + "/policies", JSON.stringify(policy), getParams());
    check(res, { "status was 201": (r) => r.status == 201 });

    actions = [];
    for (let i = 0; i < Math.floor(Math.random() * user_actions.length); i++) {
        actions.push(user_actions[Math.floor(Math.random() * user_actions.length)]);
    }
    if (actions.length == 0) {
        actions = user_actions;
    }
    policy = {
        subject: data.users[Math.floor(Math.random() * data.users.length)],
        object: data.channels[Math.floor(Math.random() * data.channels.length)],
        actions: actions,
    };
    res = http.post(THINGS_URL + "/policies", JSON.stringify(policy), getParams());
    check(res, { "status was 201": (r) => r.status == 201 });
}