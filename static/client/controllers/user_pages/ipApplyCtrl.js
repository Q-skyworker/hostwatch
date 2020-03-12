controllers.controller("ipApplyCtrl", ["$scope", "loading", "$modal", "errorModal", "applyService", "confirmModal", "msgModal", "sysService", "$filter",
    function ($scope, loading, $modal, errorModal, applyService, confirmModal, msgModal, sysService, $filter) {
        $scope.filterObj = {
            business: "",
            ip: "",
            apply_type: ""
        };
        $scope.businessStr = "全部";
        $scope.business_list = [{'bk_biz_id': '-1', 'bk_biz_name': '全部'}];
        $scope.applyList = [];
        $scope.Pagingdata = [];
        $scope.totalSerItems = 0;
        $scope.pagingOptions = {
            pageSizes: [10, 50, 100],
            pageSize: "10",
            currentPage: 1
        };

        $scope.searchList = function () {
            loading.open();
            $scope.filterObj.business = $scope.businessStr;
            if ($scope.businessStr == '全部') {
                $scope.filterObj.business = "";
            }
            applyService.search_user_apply({}, $scope.filterObj, function (res) {
                loading.close();
                if (res.result) {
                    $scope.applyList = res.data;
                    $scope.pagingOptions.currentPage = 1;
                    $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
                } else
                    errorModal.open(res.data);
            });
        };

        $scope.init = function () {
            loading.open();
            sysService.search_business({}, {}, function (res) {
                loading.close();
                if (res.result)
                    $scope.business_list = $scope.business_list.concat(res.data);
                $scope.searchList();
            });
        };
        $scope.init();

        $scope.refresh_apply_attr = function (applyobj) {
            loading.open();
            applyobj.attr_list = [];
            applyService.get_apply_attr({}, {"id": applyobj.id}, function (res) {
                loading.close();
                if (res.result) {
                    applyobj.attr_list = res.data;
                } else {
                    errorModal.open(res.data);
                }
            });
        };

        $scope.getPagedDataAsync = function (pageSize, page) {
            $scope.setPagingData($scope.applyList ? $scope.applyList : [], pageSize, page);
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
            totalServerItems: 'totalSerItems',
            pagingOptions: $scope.pagingOptions,
            columnDefs: [
                {field: "apply_type_name", displayName: "申请类型", width: 90},
                {field: "apply_num", displayName: "申请单号", width: 110},
                {field: "business", displayName: "业务系统", width: 80},
                {field: "ip_list", displayName: "IP地址"},
                {
                    displayName: "云区域",
                    width: 80,
                    cellTemplate: '<div style="width:100%;padding:5px 10px;">{{row.entity.cloud_id}}</div>'
                },
                {field: "when_expired", displayName: "过期时间", width: 100},
                {field: "when_created", displayName: "创建时间", width: 150},
                {field: "status_name", displayName: "状态", width: 80},
                {
                    displayName: "操作", width: 180, cellClass: 'textAlignCenter',
                    cellTemplate: '<div style="width:100%;text-align: center;padding-top:5px;">' +
                        '<span ng-if="row.entity.status == \'03\' && row.entity.apply_type == \'00\'" ng-click="commitApply(row.entity)" class="label label-info label-outline" style="min-width:50px;margin-right: 5px;cursor:pointer;">提交</span>' +
                        '<span ng-if="row.entity.status == \'03\' && row.entity.apply_type == \'01\'" ng-click="commitRenewalApply(row.entity)" class="label label-info label-outline" style="min-width:50px;margin-right: 5px;cursor:pointer;">提交</span>' +
                        '<span ng-if="row.entity.status == \'03\' && row.entity.apply_type == \'00\'" ng-click="editApply(row.entity)" class="label label-warning label-outline">编辑</span>' +
                        '<span ng-if="row.entity.status == \'03\' && row.entity.apply_type == \'01\'" ng-click="editRenewal(row.entity)" class="label label-warning label-outline">编辑</span>' +
                        '<span ng-if="row.entity.status != \'03\' && row.entity.apply_type == \'00\'" ng-click="openNew(row.entity)" class="label label-success label-outline">详情</span>' +
                        '<span ng-if="row.entity.status != \'03\' && row.entity.apply_type == \'01\'" ng-click="openRenewal(row.entity)" class="label label-success label-outline">详情</span>' +
                        '<span ng-if="row.entity.status == \'03\'" ng-click="delApply(row)" class="label label-danger label-outline" style="min-width:50px;margin-left: 5px;cursor:pointer;">删除</span>' +
                        '</div>'
                }
            ]
        };

        $scope.addApply = function () {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/user_pages/newApply.html',
                windowClass: 'applyDialog',
                controller: 'newApplyCtrl',
                backdrop: 'static'
            });
            modalInstance.result.then(function () {
                $scope.searchList();
            });
        };

        $scope.renewalApply = function () {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/user_pages/renewalApply.html',
                windowClass: 'renewalDialog',
                controller: 'renewalApplyCtrl',
                backdrop: 'static'
            });
            modalInstance.result.then(function () {
                $scope.searchList();
            });
        };

        $scope.commitApply = function (rowEntity) {
            confirmModal.open({
                text: "是否要提交该申请",
                type: 'commit',
                confirmClick: function () {
                    $scope.refresh_apply_attr(rowEntity);
                    var errors = CWApp.validate_apply(rowEntity, $filter);
                    if (errors.length > 0) {
                        errorModal.open(errors);
                        return;
                    }
                    rowEntity.ip_pool_id = rowEntity.ip_pool.id;
                    rowEntity.status = "00";
                    loading.open();
                    applyService.edit_apply_obj({}, rowEntity, function (res) {
                        loading.close();
                        if (res.result) {
                            msgModal.open("success", "提交成功");
                        } else {
                            errorModal.open(res.data);
                        }
                        $scope.searchList();
                    })
                }
            })

        };

        $scope.commitRenewalApply = function (rowEntity) {
            confirmModal.open({
                text: "是否要提交该申请",
                type: 'commit',
                confirmClick: function () {
                    var errors = CWApp.validate_renewalApply(rowEntity, $filter);
                    if (errors.length > 0) {
                        errorModal.open(errors);
                        return;
                    }
                    loading.open();
                    rowEntity.status = "00";
                    applyService.edit_renewal_apply_obj({}, rowEntity, function (res) {
                        loading.close();
                        if (res.result) {
                            msgModal.open("success", "提交成功");
                        } else {
                            errorModal.open(res.data);
                        }
                        $scope.searchList();
                    });
                }
            })
        };

        $scope.openNew = function (rowEntity) {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/user_pages/newApply.html',
                windowClass: 'applyDialog',
                controller: 'openNewCtrl',
                backdrop: 'static',
                resolve: {
                    itemObj: function () {
                        return rowEntity;
                    }
                }
            });
        };

        $scope.openRenewal = function (rowEntity) {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/user_pages/renewalApply.html',
                windowClass: 'renewalDialog',
                controller: 'openRenewalCtrl',
                backdrop: 'static',
                resolve: {
                    itemObj: function () {
                        return rowEntity;
                    }
                }
            });
        };

        $scope.editApply = function (rowEntity) {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/user_pages/newApply.html',
                windowClass: 'applyDialog',
                controller: 'editApplyCtrl',
                backdrop: 'static',
                resolve: {
                    itemObj: function () {
                        return rowEntity;
                    }
                }
            });
            modalInstance.result.then(function () {
                $scope.searchList();
            })
        };

        $scope.editRenewal = function (rowEntity) {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/user_pages/renewalApply.html',
                windowClass: 'renewalDialog',
                controller: 'editRenewalCtrl',
                backdrop: 'static',
                resolve: {
                    itemObj: function () {
                        return rowEntity;
                    }
                }
            });
            modalInstance.result.then(function () {
                $scope.searchList();
            })
        };

        $scope.delApply = function (row) {
            confirmModal.open({
                text: "是否要删除该申请",
                type: 'delete',
                confirmClick: function () {
                    loading.open();
                    applyService.del_apply_obj({}, row.entity, function (res) {
                        loading.close();
                        if (res.result) {
                            msgModal.open("success", "删除成功");
                            $scope.searchList();
                        } else {
                            errorModal.open(res.data);
                        }
                    })
                }
            })
        };

    }]);