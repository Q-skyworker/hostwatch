# -*- coding: utf-8 -*-
"""
Tencent is pleased to support the open source community by making 蓝鲸智云(BlueKing) available.
Copyright (C) 2017 THL A29 Limited, a Tencent company. All rights reserved.
Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://opensource.org/licenses/MIT
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.

Login middleware.
"""

from django.http import HttpResponse
import rsa
import datetime
from conf.default import APP_ID, BK_PAAS_HOST
from license_code import code_text
import uuid


class DecryptMiddleware(object):
    """License middleware."""

    def process_view(self, request, view, args, kwargs):
        """process_view."""
        # return None
        result = valid_license()
        if result:
            return None
        return HttpResponse(status=403)


def valid_license():
    try:
        license_code = code_text
        pri = u'-----BEGIN RSA PRIVATE KEY-----\nMIICYAIBAAKBgQCe1wIO8hykK7EuABcsZfva/gS0UfggGxsXGBq9fH5/8YlbdsQj\nZm8/tNnV1hhIaHAw6ccrDondFVJxeFMpbyJ5kwdwvqyLJX+JmlD7PUR7vkl2w2Pn\niLKAZVcbcF3y/ZRsw4QTbEd9xz9PwZf4UqJdaHatM1M+leVRfOcCLXRZfwIDAQAB\nAoGAOGOYJXoqVNX2BqCdmXNzH+GCBgn7jlpRGbfC9nYV6pHy83eMVgztfa5Ujyd8\nY2hAO/0iadS1eLkzFXljswM4RvIRjoepUbFXS5wTSAjIvXfPswmxbOTl0OdKoNww\n9Q8ZPNVgtpQxPi0aDa2x0WGUrorZdi9muRTW8FzA1CKsiaECRQDPQ5HkK1oAbhH5\npbHl7QiWd1AjJCx4Kaf23ZisqJWJXZukAGlG1JqwGjERr8z19gNTRNAXhnNKGwa4\ndQ/NiBFoybY8OQI9AMQwgosPRd12qejsCd7nvhsF7EaiXWhgjMlK9g6mk17FN4zE\ntRkEswyRTIRNlxqBH8VmSjSuA5DGh7czdwJFAIi4WuF3U1xbP1I94db5ACQ5Okyk\nDQ2K9PhcftzOLC476HJLryaBEjU+YcX4AKzzBoiEKPyLvTtSDqHY3n7G1i0YejTJ\nAjw3afhFbO/v6Md/KcRz+IMCwP6GyO+XPsYlSQ4M/1Haz9ur4BfC1Ef6gcPaDsxi\nSRx/NjA5hvks2FaXEWsCRGUH6TATqipQ3UkAyJ/MfqOzKe4DOz+wAXW79HFDxxCJ\nU+F8M+lxHseVpZbGFWhSPRgx/3LstTQQBH8ar6c10lFyRBgb\n-----END RSA PRIVATE KEY-----\n'
        private_key = rsa.PrivateKey.load_pkcs1(pri)
        decrypt_string = rsa.decrypt(license_code, private_key)
        app_code, mac_list, expired_time = decrypt_string.split("+")
        mac_address = get_mac_address()
        date_now = str(datetime.datetime.now()).split(" ")[0]
        if app_code != APP_ID or mac_address not in mac_list or expired_time < date_now:
            return False
        return True
    except Exception, e:
        return False


def get_mac_address():
    mac = uuid.UUID(int=uuid.getnode()).hex[-12:]
    return ":".join([mac[e:e + 2] for e in range(0, 11, 2)])
