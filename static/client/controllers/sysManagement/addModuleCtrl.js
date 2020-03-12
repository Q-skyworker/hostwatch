controllers.controller('addModuleCtrl', ["$scope", "$modal", "moduleService", "loading", "errorModal", '$modalInstance', 'msgModal',
    function ($scope, $modal, moduleService, loading, errorModal, $modalInstance, msgModal) {
        $scope.title = "新增模型";
        $scope.isAddModule = true;
        $scope.isDisplayInfo = false;
        $scope.module_obj = {
            'module': {
                'bk_obj_id': '',
                'bk_obj_name': ''
            },
            'ip_fields': '',
            'bk_cloud_id': '-1',
            'bk_cloud_const': '0',
            'level': '',
        };

        $scope.module_list = [];
        $scope.property_list = [];
        $scope.property_cloud_list = [];
        $scope.const_cloud_list = [];
        //下拉选项
        $scope.text_text = {text: ""};
        $scope.selectOptions = {
            data: "property_list",
            multiple: true,
            modelData: "module_obj.ip_fields"
        };
        $scope.searchList = function () {
            loading.open();
            moduleService.search_objects({}, {}, function (res) {
                loading.close();
                if (res.result) {
                    $scope.module_obj.module = res.data[0];
                    $scope.module_list = res.data;
                    $scope.change_module(res.data[0].bk_obj_id);
                } else {
                    errorModal.open(res.data)
                }
            })
        };
        $scope.init = function () {
            loading.open();
            moduleService.get_pool_cloud({}, {}, function (res) {
                loading.close();
                if (res.result) {
                    $scope.const_cloud_list = res.data;
                } else {
                    errorModal.open(res.data)
                }
            });
            $scope.searchList();
        };
        $scope.init();
        $scope.change_module = function (obj_id) {
            moduleService.search_object_attribute({}, obj_id, function (res) {
                if (res.result) {
                    $scope.property_list = res.data;
                    $scope.property_cloud_list = [{'id': '-1', 'text': '区域字段', 'bk_obj_id': obj_id}].concat(res.data);
                    $scope.property_cloud_list = $scope.property_cloud_list.concat([{
                        'id': '-2', 'text': '无', 'bk_obj_id': obj_id
                    }]);
                    $scope.module_obj.ip_fields = ''
                } else {
                    errorModal.open(res.data)
                }
            })
        };


        $scope.is_submit = false
        $scope.confirm = function () {
            $scope.is_submit = true
            var res = validate_module($scope.module_obj);
            var errors = res.data;
            var unique_arg = res.unique_arg;
            if (unique_arg) {
                loading.open();
                moduleService.validate_module_level({}, {
                    'module_id': $scope.module_obj.module.bk_obj_id,
                    'level': $scope.module_obj.level
                }, function (res) {
                    loading.close();
                    if (!res.result) {
                        errorModal.open(res.data);
                        return;
                    } else {
                        errors = errors.concat(res.data);
                        if (errors.length > 0) {
                            errorModal.open(errors);
                            return;
                        } else {
                            loading.open();
                            moduleService.add_cmdb_module({}, $scope.module_obj, function (res) {
                                loading.close();
                                if (res.result) {
                                    msgModal.open("success", "创建成功");
                                    $modalInstance.close()
                                } else {
                                    errorModal.open(res.data)
                                }
                            })
                        }
                    }
                })
            }
        };

        $scope.cancel = function () {
            $modalInstance.close()
        };

        $scope.leverRule = ""
        var validate_module = function (obj) {
            var errors = [];
            var unique_arg = false;
            if (obj.ip_fields == "") {
                errors.push("映射IP字段不能为空！");
            }
            if (obj.bk_cloud_id == '-1') {
                errors.push("请指定云区域字段！");
            }
            if (obj.level == '') {
                errors.push("请指定优先级！");
                $scope.leverRule = "请指定优先级！";
            } else {
                var validate_num = CWApp.isNum(obj.level);
                if (!validate_num) {
                    errors.push("请确认同步优先级所填为数字！");
                    $scope.leverRule = "请确认同步优先级所填为数字！";
                } else {
                    unique_arg = true;
                }
            }
            return {'data': errors, 'unique_arg': unique_arg}
        };

    }]);