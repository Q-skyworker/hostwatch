controllers.controller("ipPoolList", function ($scope, errorModal, $modal, loading, confirmModal, ipPoolService, msgModal) {
    $scope.isShowDetail = false;
    $scope.isModify = false;
    $scope.isModifyMask = false;
    $scope.selectItem = {};
    $scope.selectData = {};
    $scope.pool_list = [];
    $scope.args = {
        title: ""
    };

    $scope.searchList = function (currentPage = 1) {
        loading.open();
        ipPoolService.search_ip_pools({}, $scope.args, function (res) {
            loading.close();
            if (res.result) {
                $scope.pool_list = res.data;
                $scope.pagingOptions.currentPage = currentPage;
                $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
            } else {
                errorModal.open(res.data);
            }
        })
    };
    $scope.searchList();


    $scope.addObj = function () {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/ipPoolManagement/addIPPool.html',
            windowClass: 'dialog_custom',
            controller: 'addIPPool',
            backdrop: 'static'
        });
        modalInstance.result.then(function (res) {
            $scope.pool_list.push(res);
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        })
    };

    $scope.modify_pool = function (row) {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/ipPoolManagement/addIPPool.html',
            windowClass: 'dialog_custom',
            controller: 'modifyIPPool',
            backdrop: 'static',
            resolve: {
                itemObj: function () {
                    return angular.copy(row.entity);
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.searchList();
        })
    };

    $scope.delete_obj = function (row) {
        confirmModal.open({
            text: "确认删除该资源池吗？",
            type: 'delete',
            confirmClick: function () {
                loading.open();
                ipPoolService.delete_ip_pool({}, row.entity, function (res) {
                    loading.close();
                    if (res.result) {
                        msgModal.open("success", "删除成功");
                        $scope.pool_list.splice(row.rowIndex, 1);
                        $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
                    } else {
                        errorModal.open(res.data);
                    }
                })
            }
        })
    };

    $scope.Pagingdata = [];
    $scope.totalSerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [5, 10, 25, 50, 100],
        pageSize: "10",
        currentPage: 1
    };
    $scope.getPagedDataAsync = function (pageSize, page) {
        $scope.setPagingData($scope.pool_list ? $scope.pool_list : [], pageSize, page);
    };
    $scope.setPagingData = function (data, pageSize, page) {
        $scope.Pagingdata = data.slice((page - 1) * pageSize, page * pageSize);
        $scope.totalSerItems = data.length;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
    }, true);
    $scope.gridOption = {
        data: "Pagingdata",
        enablePaging: true,
        showFooter: true,
        pagingOptions: $scope.pagingOptions,
        totalServerItems: 'totalSerItems',
        columnDefs: [
            {field: 'title', displayName: '名称', width: 120},
            {field: 'ip_net', displayName: '网段', width: 150},
            {
                displayName: '云区域',
                width: 70,
                cellTemplate: '<div style="padding: 5px 10px">{{row.entity.cloud_id}}</div>'
            },
            {field: 'net_mask', displayName: '子网掩码', width: 0},
            {field: 'gate_way', displayName: '网关'},
            {field: 'dns', displayName: 'DNS服务器', width: 100},
            {field: 'created_by', displayName: '添加者'},
            {field: 'when_created', displayName: '添加时间', width: 150},
            {field: 'all_count', displayName: 'IP总数', width: 0},
            {
                displayName: '保留IP',
                width: 65,
                cellTemplate: '<div style="padding: 5px 10px">{{row.entity.keep_count}}</div>'
            },
            {
                displayName: '已分配IP',
                width: 75,
                cellTemplate: '<div style="padding: 5px 10px">{{row.entity.apply_count}}</div>'
            },
            {
                displayName: '操作', width: 140, cellClass: 'textAlignCenter',
                cellTemplate: '<div style="width:100%;text-align: center;padding-top: 5px;">' +
                    // '<span ng-click="modify_pool(row)" class="label label-info" style="min-width:50px;margin-left: 5px;cursor:pointer;">编辑</span>' +
                    '<span ng-click="detailItem(row.entity)" class="label label-info label-outline" style="min-width:50px;margin-left: 5px;cursor:pointer;">详情</span>' +
                    '<span ng-click="delete_obj(row)" class="label label-danger label-outline" style="min-width:50px;margin-left: 5px;cursor:pointer;">删除</span>' +
                    '</div>'
            }

        ]
    };

    // 资源池详情
    $scope.detailItem = function (rowEntity) {
        if (rowEntity.net_mask != "") {
            $scope.isModifyMask = true;
        }
        loading.open();
        ipPoolService.get_pool_attr_value({}, {id: rowEntity.id}, function (res) {
            loading.close();
            $scope.isShowDetail = true;
            setTimeout(function () {
                $('.addInfo').addClass('action')
            }, 200);
            $scope.selectItem = angular.copy(rowEntity);
            $scope.selectItem.attrObj = [];
            if (res.result) {
                $scope.selectItem.attrObj = res.data;
                $scope.selectData = angular.copy($scope.selectItem);
            } else {
                errorModal.open(res.data);
            }
        })
    };

    // 关闭
    $scope.closeInfo = function () {
        $('.addInfo').removeClass('action');
        setTimeout(function () {
            $scope.isShowDetail = false;
            $scope.isModify = false;
            $scope.isModifyMask = false;
            $scope.$apply();
        }, 700);
    };

    // 修改
    $scope.modify = function () {
        $scope.isModify = true;
    };

    // 取消
    $scope.cancel = function () {
        $scope.isModify = false;
        $scope.is_submit = false
        $scope.selectItem = angular.copy($scope.selectData);
    };

    $scope.rules = {}
    // 数据校验
    var validate = function () {
        var errors = [];
        $scope.rules = {
            ip_net: '',
            cloud_id: '',
            gate_way: '',
            dns: '',
        }
        if ($scope.selectItem.title === "") {
            errors.push("名称不能为空！");
        }
        if ($scope.selectItem.ip_net === "") {
            errors.push("网段不能为空！");
            $scope.rules.ip_net = "网段不能为空！";
        } else {
            var tmp = $scope.selectItem.ip_net.split("/");
            if (tmp.length !== 2 || !CWApp.isIP(tmp[0]) || !CWApp.isNum(tmp[1]) || (tmp[1] < 0 || tmp[1] > 32)) {
                $scope.rules.ip_net = "网段格式有误！"
                errors.push("网段格式有误!");
            }
        }
        if ($scope.selectItem.cloud_id === '') {
            errors.push("云区域不能为空!");
            $scope.rules.cloud_id = "云区域不能为空!";
        } else if (!CWApp.isNum($scope.selectItem.cloud_id)) {
            errors.push("云区域必须为数字!");
            $scope.rules.cloud_id = "云区域必须为数字!";
        }
        if ($scope.selectItem.gate_way === "") {
            errors.push("网关不能为空！");
            $scope.rules.gate_way = "网关不能为空！";
        } else if (!CWApp.isIP($scope.selectItem.gate_way)) {
            $scope.rules.gate_way = "网关格式有误!";
            errors.push("网关格式有误!");
        }
        if ($scope.selectItem.dns === "") {
            errors.push("DNS服务器不能为空！");
            $scope.rules.dns = "DNS服务器不能为空！"
        } else if (!CWApp.isIP($scope.selectItem.dns)) {
            errors.push("DNS服务器格式有误!");
            $scope.rules.dns = "DNS服务器格式有误!"
        }
        for (var i = 0; i < $scope.selectItem.attrObj.length; i++) {
            if ($scope.selectItem.attrObj[i].is_required && $scope.selectItem.attrObj[i].value == "") {
                errors.push($scope.selectItem.attrObj[i].cn_name + "不能为空！");
            }
        }
        return errors
    };

    $scope.is_submit = false
    // 确认修改
    $scope.confirm = function () {
        var errors = validate();
        $scope.is_submit = true
        if (errors.length > 0) {
            return;
        }
        if (!$scope.selectItem.cloud_id)
            $scope.selectItem.cloud_id = '0';
        loading.open();
        ipPoolService.modify_pool_obj({}, $scope.selectItem, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "修改成功");
                $scope.searchList($scope.pagingOptions.currentPage);
                $scope.isModify = false;
                $scope.isModifyMask = false;
                $scope.closeInfo()
            } else {
                errorModal.open(res.data);
                $scope.isModify = false;
                $scope.isModifyMask = false;
            }
        })
    }

});



