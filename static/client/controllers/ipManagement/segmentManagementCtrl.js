controllers.controller('segmentManagementCtrl', ["$scope", "ipService", "$modal", "loading", "errorModal", "confirmModal", "msgModal", function ($scope, ipService, $modal, loading, errorModal, confirmModal, msgModal) {
    $scope.ip_list = [];
    $scope.selectData = [];
    $scope.filterObj = {
        business: "",
        ip: "",
        created_by: "",
        owner: "",
        ip_status: ""
    };
    $scope.searchList = function (currentPage = 1) {
        loading.open();
        ipService.search_admin_ips({}, $scope.filterObj, function (res) {
            loading.close();
            if (res.result) {
                $scope.ip_list = res.data;
                $scope.pagingOptions.currentPage = currentPage;
                $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
            } else {
                errorModal.open(res.data);
            }
        })
    };
    $scope.searchList();

    $scope.Pagingdata = [];
    $scope.totalSerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [5, 10, 25, 50, 100],
        pageSize: "10",
        currentPage: 1
    };
    $scope.getPagedDataAsync = function (pageSize, page) {
        $scope.setPagingData($scope.ip_list ? $scope.ip_list : [], pageSize, page);
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
            {field: "ip", displayName: "IP"},
            {
                displayName: '云区域',
                width: 70,
                cellTemplate: '<div style="padding: 5px 10px">{{row.entity.cloud_id}}</div>'
            },
            {field: "ip_pool.ip_net", displayName: "网段"},
            {field: "business", displayName: "业务系统"},
            {field: "owner", displayName: "管理员"},
            {field: "when_expired", displayName: "过期时间"},
            {field: "status", displayName: "使用状态"},
            {field: "description", displayName: "描述"},
            {
                displayName: "操作", width: 150, cellClass: 'textAlignCenter',
                cellTemplate: '<div style="width:100%;text-align: center;padding-top:5px;">' +
                    '<span class="label label-primary label-outline" ng-click="detailItem(row.entity)">详情</span>&nbsp;' +
                    // '<span class="label label-info label-sm label-btn" ng-click="modifyItem(row.entity)">修改</span>&nbsp;' +
                    '<span class="label label-danger label-outline" ng-click="deleteItem(row)" style="margin-left: 5px">删除</span>' +
                    '</div>'
            }
        ]
    };

    $scope.addIPs = function () {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/ipManagement/addIPs.html',
            windowClass: 'applyDialog',
            controller: 'addIPsCtrl',
            backdrop: 'static'
        });
        modalInstance.result.then(function () {
            $scope.searchList();
        });
    };

    $scope.modifyItem = function (rowEntity) {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/ipManagement/addIPs.html',
            windowClass: 'applyDialog',
            controller: 'modifyIPsCtrl',
            backdrop: 'static',
            resolve: {
                item: function () {
                    return angular.copy(rowEntity);
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.searchList();
        });
    };

    $scope.deleteItem = function (row) {
        confirmModal.open({
            text: "请确认是否删除该已分配IP",
            type: 'delete',
            confirmClick: function () {
                loading.open();
                ipService.delete_ips({
                    id: row.entity.id
                }, {}, function (res) {
                    if (res.result) {
                        loading.close();
                        $scope.ip_list.splice(row.rowIndex, 1);
                        $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
                    } else {
                        errorModal.open(res.data);
                    }
                })
            }
        })
    };
    $scope.isShowDetail = false;
    $scope.isModify = false;
    $scope.isModifyMask = false;
    $scope.selectItem = {};
    $scope.userList = [];
    $scope.userOption = {
        data: "userList",
        modelData: "selectItem.owner_id"
    };
    $scope.detailItem = function (rowEntity) {
        if (rowEntity.net_mask != "") {
            $scope.isModifyMask = true;
        }
        loading.open();
        ipService.get_ip_attr_value({}, {id: rowEntity.id}, function (res) {
            loading.close();
            $scope.selectItem = angular.copy(rowEntity);
            $scope.isShowDetail = true;
            setTimeout(function () {
                $('.addInfo').addClass('action')
            }, 200);
            if (res.result) {
                $scope.selectItem.attrObj = res.attr_data;
                $scope.selectData = angular.copy($scope.selectItem);
                $scope.userList = res.user_data;
                for (var i = 0; i < $scope.userList.length; i++) {
                    if ($scope.userList[i].text == $scope.selectItem.owner) {
                        $scope.selectItem.owner_id = $scope.userList[i].id;
                        break;
                    }
                }
            } else {
                errorModal.open(res.data)
            }
        })
    };
    $scope.returnBack = function () {
        $scope.closeInfo()
    };

    $scope.closeInfo = function () {
        $('.addInfo').removeClass('action');
        setTimeout(function () {
            $scope.isShowDetail = false;
            $scope.isModify = false;
            $scope.isModifyMask = false;
            $scope.$apply();
        }, 100);
    };

    $scope.changeMail = function () {
        for (var i = 0; i < $scope.userList.length; i++) {
            if ($scope.userList[i].id === $scope.selectItem.owner_id) {
                $scope.selectItem.owner_mail = $scope.userList[i].email;
                break;
            }
        }
    };

    $scope.modify = function () {
        $scope.isModify = true;
    };

    $scope.cancel = function () {
        $scope.isModify = false;
        $scope.is_submit = false
        $scope.selectItem = angular.copy($scope.selectData);
    };

    $scope.rules = {}
    $scope.is_submit = false
    $scope.confirm = function () {
        for (var i in $scope.userList) {
            if ($scope.userList[i].id == $scope.selectItem.owner_id) {
                $scope.selectItem.owner = $scope.userList[i].text;
            }
        }
        var errors = [];
        $scope.is_submit = true
        $scope.rules = {
            gate_way: '',
            dns: ''
        }
        if ($scope.selectItem.gate_way === "") {
            errors.push("网关不能为空！");
            $scope.rules.gate_way = "网关不能为空！";
        } else {
            if (!CWApp.isIP($scope.selectItem.gate_way)) {
                errors.push("网关格式有误!");
                $scope.rules.gate_way = "网关格式有误!";
            }
        }
        if ($scope.selectItem.dns === "") {
            errors.push("DNS服务器不能为空！");
            $scope.rules.dns = "DNS服务器不能为空！";
        } else {
            if (!CWApp.isIP($scope.selectItem.dns)) {
                errors.push("DNS服务器格式有误!");
                $scope.rules.dns = "DNS服务器格式有误!";
            }
        }
        if ($scope.selectItem.owner === "") {
            errors.push("管理员不能为空！")
        }
        if ($scope.selectItem.owner_mail === "") {
            errors.push("管理员邮箱不能为空！")
        }
        if ($scope.selectItem.when_expired === "") {
            errors.push("过期时间不能为空！")
        }
        for (var i = 0; i < $scope.selectItem.attrObj.length; i++) {
            if ($scope.selectItem.attrObj[i].is_required && $scope.selectItem.attrObj[i].value === "") {
                errors.push($scope.selectItem.attrObj[i].cn_name + "不能为空！");
            }
        }
        if (errors.length > 0) {
            return;
        }
        loading.open();
        ipService.modify_ip_obj({}, $scope.selectItem, function (res) {
            loading.close();
            if (res.result) {
                $scope.closeInfo()
                msgModal.open("success", "编辑成功");
                $scope.searchList($scope.pagingOptions.currentPage);
            } else {
                errorModal.open(res.data);
                $scope.isModify = false;
                $scope.isModifyMask = false;
            }
        })
    };

    // 批量导入分配数据
    $scope.importIP = function () {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/ipManagement/batchAddIP.html',
            windowClass: 'csvDialog',
            controller: 'batchAddIPCtrl',
            backdrop: 'static'
        });
        modalInstance.result.then(function () {
            $scope.searchList();
        });
    }


}]);