controllers.controller('mailAddCtrl', ["$scope", "sysService", "errorModal", "$modalInstance", "loading", "msgModal", function ($scope, sysService, errorModal, $modalInstance, loading, msgModal) {
    $scope.title = "添加管理员邮箱";

    $scope.filter_obj = {
        user_name: ''
    };
    $scope.mailList = [];
    $scope.rowSection = [];


    $scope.PagingData = [];
    $scope.totalSerItems = 0;

    $scope.pagingOptions = {
        pageSizes: [10, 50, 100],
        pageSize: "10",
        currentPage: 1
    };

    $scope.getMailList = function () {
        loading.open();
        sysService.get_all_mails({}, {}, function (res) {
            loading.close();
            if (res.result) {
                $scope.mailList = res.data;
                $scope.mailAll = res.data;
                $scope.pagingOptions.currentPage = 1;
                $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
            } else {
                errorModal.open(res.data);
            }
        })
    };

    $scope.getPagedDataAsync = function (pageSize, page) {
        $scope.setPagingData($scope.mailList ? $scope.mailList : [], pageSize, page);
    };

    $scope.setPagingData = function (data, pageSize, page) {
        $scope.PagingData = data.slice((page - 1) * pageSize, page * pageSize);
        $scope.totalSerItems = data.length;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
    }, true);

    $scope.getMailList();
    $scope.search_detail = function () {
        $scope.mailList = [];
        if ($scope.filter_obj.user_name != "") {
            for (var i = 0; i < $scope.mailAll.length; i++) {
                if ((angular.lowercase($scope.mailAll[i].user_name).indexOf(angular.lowercase($scope.filter_obj.user_name)) > -1)) {
                    $scope.mailList.push($scope.mailAll[i]);
                }
            }
        } else {
            $scope.mailList = angular.copy($scope.mailAll);
        }
        $scope.pagingOptions.currentPage = 1;
        $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
    };

    $scope.gridOption = {
        data: "PagingData",
        multiSelect: true,
        enableRowSelection: true,
        enablePaging: true,
        showFooter: true,
        pagingOptions: $scope.pagingOptions,
        totalServerItems: 'totalSerItems',
        showSelectionCheckbox: true,
        selectedItems: $scope.rowSection,
        selectWithCheckboxOnly: true,
        columnDefs: [
            {field: "user_name", displayName: "用户名"},
            {field: "email", displayName: "邮箱"}
        ]
    };

    $scope.confirm = function () {
        if (!$scope.rowSection.length) {
            errorModal.open(["请至少选择一项!"]);
            return;
        }
        loading.open();
        sysService.add_mail({}, $scope.rowSection, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "添加成功");
                $modalInstance.close(res.data);
            } else {
                errorModal.open(res.data.split(";"));
            }
        })
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };
}]);