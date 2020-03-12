controllers.controller('operationLogCtrl', ["$scope", "errorModal", "sysService", "$filter", "$modal", "loading", function ($scope, errorModal, sysService, $filter, $modal, loading) {
    var dateStart = new Date();
    var dateEnd = new Date();
    $scope.DateStart = dateStart.setDate(dateStart.getDate() - 29);
    $scope.DateEnd = dateEnd.setDate(dateEnd.getDate() + 1);

    $scope.recordList = [];
    $scope.Pagingdata = [];
    $scope.totalSerItems = 0;

    $scope.pagingOptions = {
        pageSizes: [10, 50, 100],
        pageSize: "10",
        currentPage: 1
    };

    $scope.filter = {
        operator: "",
        operateType: "",
        whenStart: $filter('date')($scope.DateStart, 'yyyy-MM-dd'),
        whenEnd: $filter('date')($scope.DateEnd, 'yyyy-MM-dd')
    };

    $scope.SearchObj = function () {
        if ($scope.filter.whenStart > $scope.filter.whenEnd) {
            errorModal.open(["开始时间不能大于结束时间！"])
            return
        }
        loading.open();
        sysService.search_log({}, $scope.filter, function (res) {
            loading.close();
            $scope.recordList = res.data;
            $scope.pagingOptions.currentPage = 1;
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        })
    };
    $scope.SearchObj();

    $scope.getPagedDataAsync = function (pageSize, page) {
        $scope.setPagingData($scope.recordList ? $scope.recordList : [], pageSize, page);
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

    $scope.gridoption = {
        data: "Pagingdata",
        enablePaging: true,
        showFooter: true,
        pagingOptions: $scope.pagingOptions,
        totalServerItems: 'totalSerItems',
        columnDefs: [
            {
                displayName: '操作人',
                width: 100,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.operator}}">{{row.entity.operator}}</span></div>'
            },
            {
                displayName: '操作对象',
                width: 150,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.operate_obj}}">{{row.entity.operate_obj}}</span></div>'
            },
            {
                displayName: '操作类型',
                width: 100,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.operate_type_name}}">{{row.entity.operate_type_name}}</span></div>'
            },
            {
                displayName: '操作时间',
                width: 200,
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.when_created}}">{{row.entity.when_created}}</span></div>'
            },
            {
                displayName: '操作概要',
                cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span title="{{row.entity.operate_summary}}">{{row.entity.operate_summary}}</span></div>'
            },
            {
                displayName: '操作', width: 80, cellClass: 'textAlignCenter',
                cellTemplate: '<div style="width:100%;padding-top:5px;text-align: center">' +
                    '<span class="label label-primary label-outline" ng-click="openDetail(row.entity)">详情</span>' +
                    '</div>'
            }
        ]
    };

    $scope.openDetail = function (rowEntity) {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/sysManagement/logDetail.html',
            windowClass: 'dialog_custom',
            controller: 'logDetail',
            backdrop: 'static',
            resolve: {
                objectItem: function () {
                    return angular.copy(rowEntity);
                }
            }
        });
    }
}]);
