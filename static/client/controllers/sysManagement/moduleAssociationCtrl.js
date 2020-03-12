controllers.controller('moduleAssociationCtrl', ["$scope", "$modal", "moduleService", "loading", "errorModal", "msgModal", "confirmModal",
    function ($scope, $modal, moduleService, loading, errorModal, msgModal, confirmModal) {
        $scope.model_list = [];
        $scope.filterObj = {
            'model_name': '',
        };
        $scope.Pagingdata = [];
        $scope.totalSerItems = 0;
        $scope.pagingOptions = {
            pageSizes: [5, 10, 25, 50, 100],
            pageSize: "10",
            currentPage: 1
        };

        $scope.searchList = function () {
            loading.open();
            moduleService.search_cmdb_module({}, $scope.filterObj, function (res) {
                loading.close();
                if (res.result) {
                    $scope.model_list = res.data;
                    $scope.pagingOptions.currentPage = 1;
                    $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
                } else {
                    errorModal.open(res.data)
                }
            })
        };
        $scope.searchList();


        $scope.getPagedDataAsync = function (pageSize, page) {
            $scope.setPagingData($scope.model_list ? $scope.model_list : [], pageSize, page);
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
                    displayName: '模型名称',
                    width: 150,
                    cellTemplate: '<div style="line-height: 30px;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span>{{row.entity.bk_obj_name}}</span></div>'
                },
                {
                    displayName: '模型标识',
                    width: 150,
                    cellTemplate: '<div style="line-height: 30px;middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span>{{row.entity.bk_obj_id}}</span></div>'
                },
                {
                    displayName: '同步优先级',
                    width: 120,
                    cellTemplate: '<div style="line-height: 30px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span">{{row.entity.level}}</span></div>'
                },
                {
                    displayName: '云区域字段',
                    width: 150,
                    cellTemplate: '<div style="line-height: 30px;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span>{{row.entity.bk_cloud_id}}</span></i></div>'
                },
                {
                    displayName: 'IP字段',
                    cellTemplate: '<div style="line-height: 30px;padding-left: 5px;vertical-align: middle;width:100%;text-overflow: ellipsis;overflow: hidden;white-space: nowrap"><span>{{row.entity.ip_fields}}</span></div>'
                },
                {
                    displayName: "操作", width: 200, cellClass: 'textAlignCenter',
                    cellTemplate: '<div style="width:100%;text-align: center;padding-top:5px;">' +
                        '<span class="label label-success label-outline" ng-click="module_async(row.entity)" style="min-width:50px;cursor:pointer;">同步</span>' +
                        '<span class="label label-primary label-outline" ng-click="relate_attr(row.entity)" style="min-width:50px;margin-left: 5px;cursor:pointer;">属性映射</span>' +
                        '<span class="label label-danger label-outline" ng-click="del_module(row.entity)" style="min-width:50px;margin-left: 5px;cursor:pointer;">删除</span>' +
                        '</div>'
                }
            ]
        };

        $scope.addObj = function () {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/sysManagement/addModule.html',
                windowClass: 'dialog_custom',
                controller: 'addModuleCtrl',
                backdrop: 'static',
            });
            modalInstance.result.then(function () {
                $scope.searchList()
            })
        };

        $scope.module_async = function (rowEntity) {
            confirmModal.open({
                text: "确认要进行同步该模型",
                type: 'sync',
                confirmClick: function () {
                    loading.open();
                    moduleService.sync_cmdbmodule_manual({}, rowEntity, function (res) {
                        loading.close();
                        if (res.result) {
                            msgModal.open('info', '开始同步！')
                        } else {
                            errorModal.open(res.data)
                        }
                    })
                }
            })
        };

        $scope.relate_attr = function (rowEntity) {
            var modalInstance = $modal.open({
                templateUrl: static_url + 'client/views/sysManagement/addModule.html',
                windowClass: 'dialog_custom',
                controller: 'mapModuleCtrl',
                backdrop: 'static',
                resolve: {
                    itemObj: function () {
                        return rowEntity
                    }
                }
            });
            modalInstance.result.then(function () {
                $scope.searchList()
            })
        };

        $scope.del_module = function (rowEntity) {
            confirmModal.open({
                text: "是否要删除该模型",
                type: 'delete',
                confirmClick: function () {
                    loading.open();
                    moduleService.delete_cmdb_module({}, rowEntity.bk_obj_id, function (res) {
                        loading.close();
                        if (res.result) {
                            msgModal.open('success', '删除成功！');
                            $scope.searchList()
                        } else {
                            errorModal.open(res.data)
                        }
                    })
                }
            })
        }


    }]);