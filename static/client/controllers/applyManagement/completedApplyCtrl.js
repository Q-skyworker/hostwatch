controllers.controller('completedApplyCtrl', ["$scope", "applyService", "$modal", "errorModal", "loading", function ($scope, applyService, $modal, errorModal, loading) {

    $scope.applyList = [];
    $scope.filterObj = {
        business: "",
        ip: "",
        created_by: "",
        status: "0",
        apply_type: ""
    };

    $scope.totalSerItems = 0;

    $scope.pagingOptions = {
        pageSizes: [10, 50, 100],
        pageSize: "10",
        currentPage: 1
    };
    $scope.getPagedDataAsync = function (pageSize, page) {
        $scope.setPagingData($scope.applyList ? $scope.applyList : [], pageSize, page);
    };
    $scope.Pagingdata = [];
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
    $scope.searchList = function () {
        loading.open();
        applyService.search_complete_apply({}, $scope.filterObj, function (res) {
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

    $scope.gridOption = {
        data: "Pagingdata",
        enablePaging: true,
        showFooter: true,
        totalServerItems: 'totalSerItems',
        pagingOptions: $scope.pagingOptions,
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
                displayName: '申请时间',
                width: 160,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.when_created}}">{{row.entity.when_created}}</span></div>'
            },
            {
                displayName: '状态',
                width: 90,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.status_name}}">{{row.entity.status_name}}</span></div>'
            },
            {
                displayName: "操作", width: 70, cellClass: 'textAlignCenter',
                cellTemplate: '<div style="width:100%;text-align: center;padding-top:5px;">' +
                    '<span ng-if="row.entity.apply_type == \'00\'" class="label label-info label-outline" ng-click="openDetail(row.entity)">详情</span>' +
                    '<span ng-if="row.entity.apply_type == \'01\'" class="label label-info label-outline" ng-click="openRenewal(row.entity)">详情</span>' +
                    '</div>'
            }
        ]
    };
    $scope.openDetail = function (rowEntity) {
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

}]);