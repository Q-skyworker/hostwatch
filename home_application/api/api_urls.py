# -*- coding: utf-8 -*-

from django.conf.urls import patterns

urlpatterns = patterns(
    'home_application.api.api_views',
    (r'^get_net_pools$', 'get_net_pools'),
    (r'^get_pool_ips$', 'get_pool_ips'),
    (r'^ip_allot$', 'ip_allot'),
    (r'^ip_recycle$', 'ip_recycle'),
    (r'^ip_renewal$', 'ip_renewal'),
    (r'^auto_allot_ip$', 'auto_allot_ip'),
    (r'^ip_apply$', 'ip_apply'),
    (r'^add_net_pool$', 'add_net_pool'),
)
