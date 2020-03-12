controllers.controller('moduleSyncRecordCtrl', ["$scope", "moduleService", "loading", "errorModal", "msgModal", "$filter", "$modal",
    function ($scope, moduleService, loading, errorModal, msgModal, $filter, $modal) {
        $scope.synclog_list = [];
        $scope.module_list = [];
        var date = new Date();
        $scope.filterObj = {
            'task_name': '',
            'model_name': '全部',
            'status': '',
            'start_time_from': $filter('date')(date.setDate(date.getDate() - 29), 'yyyy-MM-dd'),
            'start_time_to': $filter('date')(date.setDate(date.getDate() + 30), 'yyyy-MM-dd')
        };
        $scope.Pagingdata = [];
        $scope.totalSerItems = 0;
        $scope.pagingOptions = {
            pageSizes: [5, 10, 25, 50, 100],
            pageSize: "10",
            currentPage: 1
        };
        $scope.init = function () {
            loading.open();
            moduleService.search_objects({}, {}, function (res) {
                loading.close();
                if (res.result) {
                    $scope.module_list = [{'bk_obj_name': '全部', 'bk_obj_id': ''}].concat(res.data)
                } else {
                    errorModal.open(res.data)
                }
                $scope.search_list();
            })
        };
        $scope.init();
        var statues = {
            'RUNNING': '运行中',
            'COMPLETE': '已完成'
        }
        $scope.search_list = function () {
            if ($scope.filterObj.start_time_to < $scope.filterObj.start_time_from) {
                errorModal.open(["开始时间不能大于结束时间！"])
                return
            }
            loading.open();
            moduleService.search_sync_log({}, $scope.filterObj, function (res) {
                loading.close();
                if (res.result) {
                    res.data.forEach(item => {
                        item.cn_status = statues[item.status]
                    })
                    $scope.synclog_list = res.data;
                    $scope.pagingOptions.currentPage = 1;
                    $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
                } else {
                    errorModal.open(res.data)
                }
            })
        };

        $scope.getPagedDataAsync = function (pageSize, page) {
            $scope.setPagingData($scope.synclog_list ? $scope.synclog_list : [], pageSize, page);
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
                {field: 'name', displayName: '任务名'},
                {field: 'model_name', displayName: '模型'},
                {
                    displayName: '开始时间',
                    cellTemplate: '<div style="width:100%;padding: 5px 10px">' +
                        '<span>{{row.entity.start_time}}</span></div>'
                },
                {
                    displayName: '结束时间',
                    cellTemplate: '<div style="width:100%;padding: 5px 10px">' +
                        '<span>{{row.entity.end_time}}</span></div>'
                },
                {
                    displayName: '状态',
                    cellTemplate: '<div style="width:100%;padding: 5px 10px">' +
                        '<span>{{row.entity.cn_status}}</span></div>'
                },
                {
                    displayName: '操作', width: 180, cellClass: 'textAlignCenter',
                    cellTemplate: '<div style="width:100%;text-align: center;padding-top: 5px;z-index: 1">' +
                        '<span ng-click="detail_sync(row.entity)" class="label label-outline label-primary" style="min-width:50px;margin-left: 5px;cursor:pointer;">详情</span>' +
                        '</div>'
                }
            ]
        };

        $scope.detail_sync = function (entity) {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/sysManagement/syncLogDetail.html',
                windowClass: 'dialog_custom',
                controller: 'syncLogDetailCtrl',
                backdrop: 'static',
                resolve: {
                    itemObj: function () {
                        return entity.id
                    }
                }
            });
        }

    }]);