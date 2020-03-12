# -*- coding: utf-8 -*-
import functools
from django.http import HttpResponse
from license_code import code_text
from conf.default import MIDDLEWARE_CLASSES
from home_application.middlewares import valid_license

from common.log import logger
from common.mymako import render_json
import json


class LicenseCheck(object):
    def __init__(self):
        self.license_code = code_text

    def __call__(self, task_definition):
        @functools.wraps(task_definition)
        def wrapper(*args, **kwargs):
            if 'home_application.middlewares.LicenseMiddleware' not in MIDDLEWARE_CLASSES:
                return HttpResponse(403)
            result = valid_license()
            if result:
                return task_definition(*args, **kwargs)
            return HttpResponse(403)

        return wrapper


class TryException(object):
    """
    decorator. log exception if task_definition has
    """

    def __init__(self, exception_desc='', exception_return='', is_response=True):
        self.exception_desc = exception_desc
        self.exception_return = exception_return
        self.is_response = is_response

    def __call__(self, task_definition):
        @functools.wraps(task_definition)
        def wrapper(*args, **kwargs):
            try:
                return task_definition(*args, **kwargs)
            except Exception as e:
                desc = '[{0}] {1}'.format(task_definition.func_name, self.exception_desc)
                logger.exception(u"%s: %s", desc, e)
                message = u'系统异常,请联系管理员!' if not self.exception_desc else self.exception_desc
                if self.is_response:
                    return render_json({
                        'result': False,
                        'message': message,
                        'data': self.exception_return
                    })
                return {"result": False, 'message': message, 'data': self.exception_return}

        return wrapper
