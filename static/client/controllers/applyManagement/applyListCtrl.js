controllers.controller('applyListCtrl', ["$scope", "$modal", "applyService", "confirmModal", "errorModal", "loading", "msgModal", function ($scope, $modal, applyService, confirmModal, errorModal, loading, msgModal) {
    $scope.applyList = [];

    $scope.filterObj = {
        business: "",
        ip: "",
        created_by: "",
        apply_type: ""
    };

    $scope.searchList = function () {
        loading.open();
        applyService.search_admin_apply({}, $scope.filterObj, function (res) {
            loading.close();
            if (res.result) {
                $scope.applyList = res.data;
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
        pagingOptions: $scope.pagingOptions,
        totalServerItems: 'totalSerItems',
        columnDefs: [
            {
                displayName: '申请类型',
                width: 100,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.apply_type_name}}">{{row.entity.apply_type_name}}</span></div>'
            },
            {
                displayName: '申请单号',
                width: 110,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.apply_num}}">{{row.entity.apply_num}}</span></div>'
            },
            {
                displayName: '业务系统',
                width: 130,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.business}}">{{row.entity.business}}</span></div>'
            },
            {
                displayName: 'IP地址',
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.ip_list}}">{{row.entity.ip_list}}</span></div>'
            },
            {
                displayName: '云区域',
                width: 80,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.ip_list}}">{{row.entity.cloud_id}}</span></div>'
            },
            {
                displayName: '过期时间',
                width: 100,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.when_expired}}">{{row.entity.when_expired}}</span></div>'
            },
            {
                displayName: '申请人',
                width: 100,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.created_by}}">{{row.entity.created_by}}</span></div>'
            },
            {
                displayName: '申请理由',
                width: 130,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.apply_reason}}">{{row.entity.apply_reason}}</span></div>'
            },
            {
                displayName: "操作", width: 160, cellClass: 'textAlignCenter',
                cellTemplate: '<div style="width:100%;text-align: center;padding-top:5px;">' +
                    '<span ng-if="row.entity.apply_type == \'00\'" class="label label-primary label-outline" ng-click="approveApply(row.entity)">审批</span>' +
                    '<span ng-if="row.entity.apply_type == \'01\'" class="label label-primary label-outline" ng-click="approveRenewal(row.entity)">审批</span>' +
                    '<span style="margin-left: 5px;" class="label label-danger label-outline" ng-click="refuseApply(row.entity)">拒绝</span>' +
                    '<span ng-if="row.entity.apply_type == \'00\'" style="margin-left: 5px;" class="label label-info label-outline" ng-click="openDetail(row.entity)">详情</span>' +
                    '<span ng-if="row.entity.apply_type == \'01\'" style="margin-left: 5px;" class="label label-info label-outline" ng-click="openRenewal(row.entity)">详情</span>' +
                    '</div>'
            }
        ]
    };

    $scope.approveApply = function (rowEntity) {
        confirmModal.open({
            text: "请确认是否要审批此IP申请单",
            confirmClick: function () {
                loading.open();
                applyService.approve_apply({}, rowEntity, function (res) {
                    loading.close();
                    if (res.result) {
                        msgModal.open("success", "审批成功");
                        $scope.searchList();
                    } else {
                        errorModal.open(res.data);
                    }
                })
            }
        })
    };

    $scope.approveRenewal = function (rowEntity) {
        confirmModal.open({
            text: "请确认是否要审批此续约申请单",
            type: 'judge',
            confirmClick: function () {
                loading.open();
                applyService.approve_renewal_apply({}, rowEntity, function (res) {
                    loading.close();
                    if (res.result) {
                        msgModal.open("success", "审批成功");
                        $scope.searchList();
                    } else {
                        errorModal.open(res.data);
                    }
                })
            }
        })
    };

    $scope.refuseApply = function (rowEntity) {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/applyManagement/approveApply.html',
            windowClass: 'refuseDialog',
            controller: 'approveApplyCtrl',
            backdrop: 'static',
            resolve: {
                item: function () {
                    return rowEntity;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.searchList();
        });
    };

    $scope.openDetail = function (rowEntity) {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/user_pages/newApply.html',
            windowClass: 'applyDialog',
            controller: 'checkApplyCtrl',
            backdrop: 'static',
            resolve: {
                item: function () {
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


}]);