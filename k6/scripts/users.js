import { group } from "k6";
import * as sdk from "./sdk.js";
import { generateTestScenarios } from "./tests.js";

export const options = {
    scenarios: generateTestScenarios(),
};

export function get_before() {
    group("get_unseeded_users", function () {
        sdk.get_users();
    });
    group("get_unseeded_profile", function () {
        sdk.get_profile();
    });
    group("get_seeded_user", function () {
        sdk.get_user();
    });
    group("get_seeded_memberships", function () {
        sdk.get_memberships();
    });

    group("get_unseeded_groups", function () {
        sdk.get_groups();
    });
    group("get_seeded_group", function () {
        sdk.get_group();
    });
    group("get_seeded_group_children", function () {
        sdk.get_group_children();
    });
    group("get_seeded_group_parents", function () {
        sdk.get_group_parents();
    });
}

export function update() {
    group("update_user", function () {
        sdk.update_user();
    });
    group("update_user_tags", function () {
        sdk.update_user_tags();
    });
    group("update_user_identity", function () {
        sdk.update_user_identity();
    });
    group("update_user_owner", function () {
        sdk.update_user_owner();
    });
    group("update_user_secret", function () {
        sdk.update_user_secret();
    });
    group("update_group", function () {
        sdk.update_group();
    });
}

export function create() {
    group("create_user", function () {
        sdk.create_user();
    });
    group("create_group", function () {
        sdk.create_group();
    });
}

export function get_after() {
    group("get_seeded_users", function () {
        sdk.get_users();
    });
    group("get_seeded_groups", function () {
        sdk.get_groups();
    });
}

export function others() {
    // group("disable_user", function () {
    //     disable_user();
    // });
    // group("enable_user", function () {
    //     enable_user();
    // });
    // group("disable_group", function () {
    //     disable_group();
    // });
    // group("enable_group", function () {
    //     enable_group();
    // });
    group("tokens", function () {
        sdk.tokens();
    });
    group("crud_user_policies", function () {
        sdk.crud_user_policies();
    });
    group("create_user_policies", function () {
        sdk.create_user_policies();
    });
}
