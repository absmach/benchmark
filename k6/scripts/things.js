import { group } from "k6";
import * as sdk from "./sdk.js";
import { generateTestScenarios } from "./tests.js";

export let options = {
    scenarios: generateTestScenarios(),
};

export function get_before() {
    group("get_unseeded_things", function () {
        sdk.get_things();
    });
    group("get_unseeded_thing", function () {
        sdk.get_thing();
    });
    group("get_unseeded_thing_channels", function () {
        sdk.get_thing_channels();
    });

    group("get_unseeded_channels", function () {
        sdk.get_channels();
    });
    group("get_unseeded_channel", function () {
        sdk.get_channel();
    });
    group("get_unseeded_channel_things", function () {
        sdk.get_channel_things();
    });
}

export function update() {
    group("update_thing", function () {
        sdk.update_thing();
    });
    group("update_thing_tags", function () {
        sdk.update_thing_tags();
    });
    group("update_thing_owner", function () {
        sdk.update_thing_owner();
    });
    group("update_thing_secret", function () {
        sdk.update_thing_secret();
    });
    group("update_channel", function () {
        sdk.update_channel();
    });
}

export function create() {
    group("create_thing", function () {
        sdk.create_thing();
    });
    group("create_things", function () {
        sdk.create_things();
    });
    group("create_channel", function () {
        sdk.create_channel();
    });
    group("create_channels", function () {
        sdk.create_channels();
    });
}

export function get_after() {
    group("get_seeded_things", function () {
        sdk.get_things();
    });
    group("get_seeded_channels", function () {
        sdk.get_channels();
    });
}

export function others() {
    // group("disable_thing", function () {
    //     sdk.disable_thing();
    // });
    // group("enable_thing", function () {
    //     sdk.enable_thing();
    // });
    // group("disable_channel", function () {
    //     sdk.disable_channel();
    // });
    // group("enable_channel", function () {
    //     sdk.enable_channel();
    // });
    group("crud_thing_policies", function () {
        sdk.crud_thing_policies();
    });
    group("create_thing_policies", function () {
        sdk.create_thing_policies();
    });
}
