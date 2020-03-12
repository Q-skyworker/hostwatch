# -*- coding: utf-8 -*-

from common.mymako import render_mako_context
from home_application.apply_views import *
from home_application.sys_views import *
from home_application.ip_views import *
from home_application.home_views import *
import sys
from home_application.ip_pool_view import *
from home_application.api.api_views import *
from home_application.module_views import *

reload(sys)
sys.setdefaultencoding("utf-8")


def home(request):
    """
    首页
    """
    user = request.user
    if not user.is_superuser:
        return render_mako_context(request, '/home_application/js_factory_user.html')

    user_id = request.user.username
    return render_mako_context(request, '/home_application/js_factory.html', {"user_id":user_id})


def user_page(request):
    return render_mako_context(request, '/home_application/js_factory_user.html')