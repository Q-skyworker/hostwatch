# -*- coding: utf-8 -*-
"""
SaaS上传部署的全局配置
"""
import os

# ===============================================================================
# 数据库设置, 正式环境数据库设置
# ===============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': "hostwatch",
        'USER': "root",
        'PASSWORD': "1qaz@WSX",
        'HOST': "127.0.0.1",
        'PORT': 3306,
    },
}
