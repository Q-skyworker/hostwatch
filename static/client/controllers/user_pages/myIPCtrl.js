controllers.controller("myIPCtrl", ["$scope", "ipService", "errorModal", "loading", "confirmModal", "msgModal", "$modal", function ($scope, ipService, errorModal, loading, confirmModal, msgModal, $modal) {
    $scope.ip_list = [];
    $scope.selectData = [];
    $scope.filterObj = {
        business: "",
        ip: "",
        created_by: "",
        ip_status: ""
    };
    $scope.searchList = function () {
        console.log(1111)
        loading.open();
        ipService.search_user_ips({}, $scope.filterObj, function (res) {
            loading.close();
            if (res.result) {
                $scope.ip_list = res.data;
                $scope.pagingOptions.currentPage = 1;
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
            {field: "ip", displayName: "IP", width: 120},
            {field: "ip_pool.ip_net", displayName: "网段", width: 120},
            {
                displayName: "云区域",
                width: 120,
                cellTemplate: '<div style="width:100%;padding:5px 10px">{{row.entity.cloud_id}}</div>'
            },
            {field: "business", displayName: "业务系统", width: 150},
            {field: "status", displayName: "使用状态", width: 150},
            {field: "when_expired", displayName: "过期时间", width: 150},
            {field: "description", displayName: "描述"},
            {
                displayName: "操作", width: 200, cellClass: 'textAlignCenter',
                cellTemplate: '<div style="width:100%;text-align: center;padding-top:5px;">' +
                    '<span class="label label-primary label-outline" ng-click="detailItem(row.entity)">详情</span>&nbsp;' +
                    '<span class="label label-danger label-outline" style="min-width:50px;margin-left: 5px;cursor:pointer;" ng-click="deleteItem(row)">上缴</span>&nbsp;' +
                    '<span class="label label-info label-outline" style="min-width:50px;margin-left: 5px;cursor:pointer;" ng-click="renewal(row.entity)">续约</span>&nbsp;' +
                    '</div>'
            }
        ]
    };

    $scope.isShowDetail = false;
    $scope.isModify = false;
    $scope.isModifyMask = false;
    $scope.isModifyGate = false;
    $scope.selectItem = {};
    $scope.userList = [];
    $scope.userOption = {
        data: "userList",
        modelData: "selectItem.owner_id"
    };
    $scope.detailItem = function (rowEntity) {
        if (rowEntity.gate_way != "") {
            $scope.isModifyGate = true;
        }
        if (rowEntity.net_mask != "") {
            $scope.isModifyMask = true;
        }
        loading.open();
        ipService.get_ip_attr_value({}, {id: rowEntity.id}, function (res) {
            loading.close();
            $scope.selectItem = rowEntity;
            $scope.isShowDetail = true;
            setTimeout(function () {
                $('.addInfo').addClass('action')
            }, 200);
            if (res.result) {
                $scope.selectItem.attrObj = res.attr_data;
                $scope.userList = res.user_data;
                for (var i = 0; i < $scope.userList.length; i++) {
                    if ($scope.userList[i].text == $scope.selectItem.owner) {
                        $scope.selectItem.owner_id = $scope.userList[i].id;
                        break;
                    }
                }
                $scope.selectData = angular.copy($scope.selectItem);
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
            $scope.isModifyGate = false;
            $scope.$apply();
        }, 100);
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
        var rules = {
            dns: '',
            mail: ''
        }
        for (var i in $scope.userList) {
            if ($scope.userList[i].id == $scope.selectItem.owner_id) {
                $scope.selectItem.owner = $scope.userList[i].text;
            }
        }
        var errors = [];
        if ($scope.selectItem.dns == "") {
            errors.push("DNS服务器不能为空！");
            rules.dns = "DNS服务器不能为空！"
        } else {
            if (!CWApp.isIP($scope.selectItem.dns)) {
                errors.push("DNS服务器格式有误!");
                rules.dns = "DNS服务器格式有误!"
            }
        }
        if ($scope.selectItem.owner_mail == "") {
            errors.push("管理员邮箱不能为空！")
            rules.mail = "管理员邮箱不能为空！"
        } else if (!CWApp.isMail($scope.selectItem.owner_mail)) {
            errors.push("邮箱格式有误！");
            rules.mail = "邮箱格式有误！"
        }
        for (var i = 0; i < $scope.selectItem.attrObj.length; i++) {
            if ($scope.selectItem.attrObj[i].is_required && $scope.selectItem.attrObj[i].value == "") {
                errors.push($scope.selectItem.attrObj[i].cn_name + "不能为空！");
            }
        }
        $scope.rules = rules
        $scope.is_submit = true
        if (errors.length > 0) {
            return;
        }
        loading.open();
        ipService.modify_ip_obj({}, $scope.selectItem, function (res) {
            loading.close();
            if (res.result) {
                $scope.closeInfo()
                msgModal.open("success", "编辑成功");
                $scope.searchList();
            } else {
                errorModal.open(res.data);
            }
        })
    };

    $scope.deleteItem = function (row) {
        confirmModal.open({
            text: "确认是否要上缴该IP",
            type: "upload",
            confirmClick: function () {
                loading.open();
                ipService.hand_ip_obj({}, row.entity, function (res) {
                    loading.close();
                    if (res.result) {
                        msgModal.open("success", "上缴成功");
                        $scope.searchList();
                    } else {
                        errorModal.open(res.data);
                    }
                })
            }
        })
    };

    $scope.renewal = function (rowEntity) {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/user_pages/renewal.html',
            windowClass: 'renewalDialog',
            controller: 'renewalCtrl',
            backdrop: 'static',
            resolve: {
                itemObj: function () {
                    return rowEntity;
                }
            }
        });
    };


}]);