services = angular.module('webApiService', ['ngResource', 'utilServices']);

//生产代码
var POST = "POST";
var GET = "GET";

//测试代码
//var sourceRoute = "./Client/MockData";
//var fileType = ".html";
//var POST = "GET";
//var GET = "GET";
services.factory('ipService', ['$resource', function ($resource) {
    return $resource(site_url + ':actionName/', {},
        {
            search_user_ips: {method: POST, params: {actionName: 'search_user_ips'}, isArray: false},
            search_admin_ips: {method: POST, params: {actionName: 'search_admin_ips'}, isArray: false},
            subject_search_admin_ips: {method: POST, params: {actionName: 'subject_search_admin_ips'}, isArray: false},
            create_ips: {method: POST, params: {actionName: 'create_ips'}, isArray: false},
            modify_ips: {method: POST, params: {actionName: 'modify_ips'}, isArray: false},
            delete_ips: {method: POST, params: {actionName: 'delete_ips'}, isArray: false},
            detect_ips: {method: POST, params: {actionName: 'detect_ips'}, isArray: false},
            allocation_search: {method: POST, params: {actionName: 'allocation_search'}, isArray: false},
            get_used_ips: {method: POST, params: {actionName: 'get_used_ips'}, isArray: false},
            search_keep_ips: {method: POST, params: {actionName: 'search_keep_ips'}, isArray: false},
            create_keep_ips: {method: POST, params: {actionName: 'create_keep_ips'}, isArray: false},
            get_ip_attr_value: {method: POST, params: {actionName: 'get_ip_attr_value'}, isArray: false},
            modify_ip_obj: {method: POST, params: {actionName: 'modify_ip_obj'}, isArray: false},
            batch_add_ip: {method: POST, params: {actionName: 'batch_add_ip'}, isArray: false},
            hand_ip_obj: {method: POST, params: {actionName: 'hand_ip_obj'}, isArray: false},
            search_attr_list: {method: POST, params: {actionName: 'search_attr_list'}, isArray: false},
        });
    }])
    .factory('applyService', ['$resource', function ($resource) {
        return $resource(site_url + ':actionName/', {},
            {
                search_user_apply: {method: POST, params: {actionName: 'search_user_apply'}, isArray: false},
                create_apply: {method: POST, params: {actionName: 'create_apply'}, isArray: false},
                search_admin_apply: {method: POST, params: {actionName: 'search_admin_apply'}, isArray: false},
                search_complete_apply: {method: POST, params: {actionName: 'search_complete_apply'}, isArray: false},
                approve_apply: {method: POST, params: {actionName: 'approve_apply'}, isArray: false},
                refuse_apply: {method: POST, params: {actionName: 'refuse_apply'}, isArray: false},
                get_apply_obj: {method: POST, params: {actionName: 'get_apply_obj'}, isArray: false},
                edit_apply_obj: {method: POST, params: {actionName: 'edit_apply_obj'}, isArray: false},
                del_apply_obj: {method: POST, params: {actionName: 'del_apply_obj'}, isArray: false},
                new_renewal_apply_obj: {method: POST, params: {actionName: 'new_renewal_apply_obj'}, isArray: false},
                edit_renewal_apply_obj: {method: POST, params: {actionName: 'edit_renewal_apply_obj'}, isArray: false},
                approve_renewal_apply: {method: POST, params: {actionName: 'approve_renewal_apply'}, isArray: false},
                get_apply_attr: {method: POST, params: {actionName: 'get_apply_attr'}, isArray: false},
            });
    }])
    .factory('sysService', ['$resource', function ($resource) {
        return $resource(site_url + ':actionName/', {},
            {
                search_log: {method: POST, params: {actionName: 'search_log'}, isArray: false},
                add_mail: {method: POST, params: {actionName: 'add_mail'}, isArray: false},
                modify_mail: {method: POST, params: {actionName: 'modify_mail'}, isArray: false},
                delete_mail: {method: POST, params: {actionName: 'delete_mail'}, isArray: false},
                search_mail: {method: POST, params: {actionName: 'search_mail'}, isArray: false},
                get_all_mails: {method: POST, params: {actionName: 'get_all_mails'}, isArray: false},
                get_sys_setting: {method: POST, params: {actionName: 'get_sys_setting'}, isArray: false},
                modify_sys_setting: {method: POST, params: {actionName: 'modify_sys_setting'}, isArray: false},
                search_custom_attr: {method: POST, params: {actionName: 'search_custom_attr'}, isArray: false},
                add_custom_attr: {method: POST, params: {actionName: 'add_custom_attr'}, isArray: false},
                delete_custom_attr: {method: POST, params: {actionName: 'delete_custom_attr'}, isArray: false},
                modify_custom_attr: {method: POST, params: {actionName: 'modify_custom_attr'}, isArray: false},
                get_custom_attr: {method: POST, params: {actionName: 'get_custom_attr'}, isArray: false},
                search_all_users: {method: POST, params: {actionName: 'search_all_users'}, isArray: false},
                set_default_img: {method: POST, params: {actionName: 'set_default_img'}, isArray: false},
                get_pool_settings: {method: POST, params: {actionName: 'get_pool_settings'}, isArray: false},
                search_business: {method: POST, params: {actionName: 'search_business'}, isArray: false},
            });
    }])
    .factory('siteService', ['$resource', function ($resource) {
        return $resource(site_url + ':actionName/', {},
            {
                get_count_obj: {method: POST, params: {actionName: 'get_count_obj'}, isArray: false},
            });
    }])
    .factory('ipPoolService', ['$resource', function ($resource) {
        return $resource(site_url + ':actionName/', {},
            {
                get_ip_pools: {method: POST, params: {actionName: 'get_ip_pools'}, isArray: false},
                create_ip_pool: {method: POST, params: {actionName: 'create_ip_pool'}, isArray: false},
                modify_ip_pool: {method: POST, params: {actionName: 'modify_ip_pool'}, isArray: false},
                delete_ip_pool: {method: POST, params: {actionName: 'delete_ip_pool'}, isArray: false},
                search_ip_pools: {method: POST, params: {actionName: 'search_ip_pools'}, isArray: false},
                get_pool_attr_value: {method: POST, params: {actionName: 'get_pool_attr_value'}, isArray: false},
                modify_pool_obj: {method: POST, params: {actionName: 'modify_pool_obj'}, isArray: false},
            });
    }])
    .factory('moduleService', ['$resource', function ($resource) {
        return $resource(site_url + ':actionName/', {},
            {
                search_objects: {method: POST, params: {actionName: 'search_objects'}, isArray: false},
                search_object_attribute: {method: POST, params: {actionName: 'search_object_attribute'}, isArray: false},
                validate_module_level: {method: POST, params: {actionName: 'validate_module_level'}, isArray: false},
                add_cmdb_module: {method: POST, params: {actionName: 'add_cmdb_module'}, isArray: false},
                search_cmdb_module: {method: POST, params: {actionName: 'search_cmdb_module'}, isArray: false},
                delete_cmdb_module: {method: POST, params: {actionName: 'delete_cmdb_module'}, isArray: false},
                get_module_map: {method: POST, params: {actionName: 'get_module_map'}, isArray: false},
                save_module_map: {method: POST, params: {actionName: 'save_module_map'}, isArray: false},
                sync_cmdbmodule_manual: {method: POST, params: {actionName: 'sync_cmdbmodule_manual'}, isArray: false},
                search_sync_log: {method: POST, params: {actionName: 'search_sync_log'}, isArray: false},
                search_sync_detail: {method: POST, params: {actionName: 'search_sync_detail'}, isArray: false},
                get_pool_cloud: {method: POST, params: {actionName: 'get_pool_cloud'}, isArray: false},
            });
    }])

;//这是结束符，请勿删除