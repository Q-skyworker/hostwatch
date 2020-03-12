# -*- coding: utf-8 -*-

from django.conf.urls import patterns

urlpatterns = patterns(
    'home_application.views',
    # 首页--your index
    (r'^$', 'home'),
    (r'^user_page/$', 'user_page'),
    (r'^get_count_obj$', 'get_count_obj'),
    # 申请单管理
    (r'^search_user_apply$', 'search_user_apply'),
    (r'^search_complete_apply$', 'search_complete_apply'),
    (r'^search_admin_apply$', 'search_admin_apply'),
    (r'^approve_apply$', 'approve_apply'),
    (r'^refuse_apply$', 'refuse_apply'),
    (r'^create_apply$', 'create_apply'),
    (r'^get_apply_obj$', 'get_apply_obj'),
    (r'^edit_apply_obj$', 'edit_apply_obj'),
    (r'^del_apply_obj$', 'del_apply_obj'),
    (r'^new_renewal_apply_obj$', 'new_renewal_apply_obj'),
    (r'^edit_renewal_apply_obj$', 'edit_renewal_apply_obj'),
    (r'^approve_renewal_apply$', 'approve_renewal_apply'),
    (r'^get_apply_attr$', 'get_apply_attr'),
    # IP管理
    (r'^search_user_ips$', 'search_user_ips'),
    (r'^search_admin_ips$', 'search_admin_ips'),
    (r'^subject_search_admin_ips$', 'subject_search_admin_ips'),
    (r'^create_ips$', 'create_ips'),
    (r'^modify_ips$', 'modify_ips'),
    (r'^allocation_search$', 'allocation_search'),
    (r'^detect_ips$', 'detect_ips'),
    (r'^delete_ips$', 'delete_ips'),
    (r'^get_all_mails$', 'get_all_mails'),
    (r'^search_keep_ips$', 'search_keep_ips'),
    (r'^create_keep_ips$', 'create_keep_ips'),
    (r'^get_ip_attr_value$', 'get_ip_attr_value'),
    (r'^modify_ip_obj$', 'modify_ip_obj'),
    (r'^download_ip_temp/$', 'download_ip_temp'),
    (r'^batch_add_ip$', 'batch_add_ip'),
    (r'^hand_ip_obj$', 'hand_ip_obj'),
    (r'^search_all_users$', 'search_all_users'),
    (r'^search_attr_list$', 'search_attr_list'),
    (r'^get_pool_settings$', 'get_pool_settings'),

    # 系統管理
    (r'^add_mail$', 'add_mail'),
    (r'^modify_mail$', 'modify_mail'),
    (r'^delete_mail$', 'delete_mail'),
    (r'^search_mail$', 'search_mail'),
    (r'^search_log$', 'search_log'),
    (r'^get_sys_setting$', 'get_sys_setting'),
    (r'^modify_sys_setting$', 'modify_sys_setting'),
    (r'^search_custom_attr$', 'search_custom_attr'),
    (r'^add_custom_attr$', 'add_custom_attr'),
    (r'^delete_custom_attr$', 'delete_custom_attr'),
    (r'^modify_custom_attr$', 'modify_custom_attr'),
    (r'^get_custom_attr$', 'get_custom_attr'),
    # 资源池管理
    (r'^get_ip_pools$', 'get_ip_pools'),
    (r'^create_ip_pool$', 'create_ip_pool'),
    (r'^modify_ip_pool$', 'modify_ip_pool'),
    (r'^delete_ip_pool$', 'delete_ip_pool'),
    (r'^search_ip_pools$', 'search_ip_pools'),
    (r'^get_pool_attr_value$', 'get_pool_attr_value'),
    (r'^modify_pool_obj$', 'modify_pool_obj'),

    # logo
    (r'^upload_img/$', 'upload_img'),
    (r'^show_logo/$', 'show_logo'),
    (r'^set_default_img$', 'set_default_img'),

    (r'^search_business', 'search_business'),
    # module
    (r'^search_objects$', 'search_objects'),
    (r'^search_object_attribute$', 'search_object_attribute'),
    (r'^validate_module_level$', 'validate_module_level'),
    (r'^add_cmdb_module$', 'add_cmdb_module'),
    (r'^search_cmdb_module$', 'search_cmdb_module'),
    (r'^delete_cmdb_module$', 'delete_cmdb_module'),
    (r'^get_module_map$', 'get_module_map'),
    (r'^save_module_map$', 'save_module_map'),
    (r'^sync_cmdbmodule_manual$', 'sync_cmdbmodule_manual'),
    (r"^get_pool_cloud$", "get_pool_cloud"),
    (r'^search_sync_log$', "search_sync_log"),
    (r'^search_sync_detail$', 'search_sync_detail'),

)
