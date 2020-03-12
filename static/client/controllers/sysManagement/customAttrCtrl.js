controllers.controller("customAttrCtrl", function ($scope, errorModal, $modal, loading, confirmModal, sysService, msgModal) {
    $scope.filterObj = {
        name: "",
        cn_name: "",
        created_by: "",
        attr_type: ""
    };

    $scope.customAttr = [];
    $scope.filterCustomAttr = [];
    $scope.Pagingdata = [];
    $scope.totalSerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [5, 10, 25, 50, 100],
        pageSize: "10",
        currentPage: 1
    };
    $scope.searchCustom = function () {
        loading.open();
        sysService.search_custom_attr({}, $scope.filterObj, function (res) {
            loading.close();
            if (res.result) {
                $scope.customAttr = res.data;
                $scope.filterCustomAttr = res.data;
                $scope.pagingOptions.currentPage = 1;
                $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
            } else {
                errorModal.open(res.data);
            }
        })
    };
    $scope.searchCustom();

    $scope.getPagedDataAsync = function (pageSize, page) {
        $scope.setPagingData($scope.customAttr ? $scope.customAttr : [], pageSize, page);
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
                displayName: "类型", width: 80,
                cellTemplate: '<div style="width:100%;padding:5px 10px;">' +
                    '<span  ng-if="row.entity.attr_type == \'ip\'">IP</span>\
                    <span  ng-if="row.entity.attr_type == \'pool\'">资源池</span>' +
                    '</div>'
            },
            {field: "name", displayName: "字段名称"},
            {field: "cn_name", displayName: "显示名称"},
            {
                displayName: "必填项", width: 80,
                cellTemplate: '<div style="width:100%;padding:5px 10px;">' +
                    '<span  ng-if="row.entity.is_required">是</span>\
                    <span  ng-if="!row.entity.is_required">否</span>' +
                    '</div>'
            },
            {field: "created_by", displayName: "添加者", width: 100},
            {field: "when_created", displayName: "添加时间"},
            {field: "description", displayName: "备注"},
            {
                displayName: "操作", width: 150, cellClass: 'textAlignCenter',
                cellTemplate: '<div style="width:100%;text-align: center;padding-top:5px;">' +
                    '<span class="label label-info label-outline" ng-click="modifyCustom(row.entity)">编辑</span>&nbsp;' +
                    '<span class="label label-danger label-outline" ng-click="deleteCustom(row)">删除</span>' +
                    '</div>'
            }
        ]
    };

    $scope.addCustom = function () {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/sysManagement/addCustom.html',
            windowClass: 'dialog_custom',
            controller: 'addCustomCtrl',
            backdrop: 'static'
        });
        modalInstance.result.then(function () {
            $scope.searchCustom();
            $scope.pagingOptions.currentPage = 1;
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        })
    };

    $scope.deleteCustom = function (row) {
        confirmModal.open({
            text: "请确认是否删除该自定义属性",
            type: 'delete',
            confirmClick: function () {
                loading.open();
                sysService.delete_custom_attr({
                    id: row.entity.id
                }, {}, function (res) {
                    if (res.result) {
                        loading.close();
                        msgModal.open("success", "删除成功");
                        $scope.customAttr.splice(row.rowIndex, 1);
                        $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
                    } else {
                        errorModal.open(res.data);
                    }
                })
            }
        })
    };

    $scope.modifyCustom = function (rowEntity) {
        var modalInstance = $modal.open({
            templateUrl: static_url + 'client/views/sysManagement/addCustom.html',
            windowClass: 'dialog_custom',
            controller: 'modifyCustomCtrl',
            backdrop: 'static',
            resolve: {
                itemObj: function () {
                    return angular.copy(rowEntity);
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.searchCustom();
        });
    };

});



