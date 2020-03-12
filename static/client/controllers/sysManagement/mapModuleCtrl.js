controllers.controller('mapModuleCtrl', ["$scope", "$modal", "moduleService", "loading", "errorModal",
    '$modalInstance', 'msgModal', 'itemObj',
    function ($scope, $modal, moduleService, loading, errorModal, $modalInstance, msgModal, itemObj) {
    $scope.title = "属性映射";
    $scope.isAddModule = false;
    $scope.is_edit_status = false;
    $scope.map_module = {
        'num': 0,
        'map_list':[]
    };
    $scope.ip_pros = [];
    $scope.cmdb_pros = [];
    $scope.cmdb_cloud_pros = [];
    $scope.const_cloud_list = [];
    $scope.text_text ={text: ""};
    $scope.selectOptions = {
        data: "cmdb_pros",
        multiple: true,
        modelData: ""
    };

    $scope.init = function () {
        loading.open();
        moduleService.get_module_map({}, itemObj.module_id, function (res) {
            if(res.result) {
                $scope.map_module.map_list = res.module_list;
                $scope.map_module.num = res.module_list.length;
                $scope.ip_pros = res.ip_pros;
                moduleService.search_object_attribute({}, itemObj.bk_obj_id, function (res) {
                    loading.close();
                    if(res.result) {
                        $scope.cmdb_pros = res.data;
                        $scope.cmdb_cloud_pros = res.data.concat([{'bk_obj_id': itemObj.bk_obj_id, 'text': '无', 'id': '-2'}]);
                    }else {
                        errorModal.open(res.data)
                    }
                })
            }else {
                errorModal.open(res.data)
            }
        });
        loading.open();
        moduleService.get_pool_cloud({}, {}, function (res) {
            loading.close();
            if(res.result) {
                $scope.const_cloud_list = res.data;
            }else {
                errorModal.open(res.data)
            }
        });

    };
    $scope.init();
    $scope.add_map_format = function (mapobj) {
        tmp_map = {'id': $scope.map_module.num, 'ip_pro_id': $scope.ip_pros[0],
            'cmdb_pro_id': $scope.cmdb_pros[0].id, 'cmdb_cloud_constant': '0', 'is_NeedMap': false};
        $scope.map_module.num ++;
        var location = $scope.map_module.map_list.indexOf(mapobj);
        $scope.map_module.map_list.splice(location+1,0,tmp_map);
    };

    $scope.del_map_format = function (mapobj) {
        if (mapobj.id <= 1){
            msgModal.open('warning','必需映射不能删除！');
            return;
        }
        var location = $scope.map_module.map_list.indexOf(mapobj);
        $scope.map_module.map_list.splice(location, 1);
    };

    $scope.modify = function () {
        $scope.is_edit_status = true
    };
    $scope.save = function () {
        var errors = validate($scope.map_module.map_list);
        if(errors.length > 0) {
            errorModal.open(errors);
            return;
        }
        loading.open();
        moduleService.save_module_map({}, {
            'module_id': itemObj.module_id,
            'module_name': itemObj.bk_obj_name,
            'map_list': $scope.map_module.map_list}, function (res) {
            loading.close();
            if(res.result) {
                msgModal.open('success', res.data);
                $modalInstance.close()
            }else {
                errorModal.open(res.data)
            }
        })
    };
    $scope.cancel = function () {
        $scope.is_edit_status = false
    };
    $scope.close = function () {
        $modalInstance.close()
    };

    var validate = function (map_list) {
        var ip_pros = [];
        for(var i in map_list) {
            ip_pros.push(map_list[i].ip_pro_id);
        }
        var ip_pros_n = ip_pros.sort();
        for(var i = 0; i < ip_pros_n.length-1; i++) {
            if(ip_pros_n[i] == ip_pros_n[i+1]) {
                return ['IP属性存在重复值!']
            }
        }
        return []
    }
}]);