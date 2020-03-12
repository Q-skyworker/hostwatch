controllers.controller('changeLogoCtrl', ["$scope", "sysService", "errorModal", "loading", "msgModal",
    function ($scope, sysService, errorModal, loading, msgModal) {


        $scope.upload_img = function () {
            var fd = new FormData();
            var files = $("#uploadFile").get(0).files;
            var error_list = test_error(files);
            if (error_list.length > 0) {
                errorModal.open(error_list);
                return
            }
            fd.append("upfile", $("#uploadFile").get(0).files[0]);
            loading.open();
            $.ajax({
                url: site_url + "upload_img/",
                type: "POST",
                processData: false,
                contentType: false,
                data: fd,
                success: function (res) {
                    loading.close();
                    if (res.result) {
                        msgModal.open("success", "上传成功");
                        window.location.reload();
                    } else {
                        errorModal.open(res.data);

                    }
                }
            });
        };

        var test_error = function (files) {
            var file_type = files[0].type;
            var file_size = files[0].size / 1024;
            var error_list = [];
            if (file_type != "image/png" && file_type != 'image/jpeg') {
                error_list.push("只允许png,jpg,jpeg格式的图片!");
            }
            if (file_size > 500) {
                error_list.push("请保证文件小于500K!");
            }
            return error_list;
        };

        $scope.setDefaultImg = function () {
            loading.open();
            sysService.set_default_img({}, {}, function (res) {
                loading.close();
                if (res.result) {
                    msgModal.open("success", "修改成功");
                    window.location.reload();
                }
            })
        }
    }]);