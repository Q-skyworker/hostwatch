# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home_application', '0006_auto_20190806_1556'),
    ]

    operations = [
        migrations.AddField(
            model_name='syncdetail',
            name='model_name',
            field=models.CharField(default='host', max_length=100, verbose_name='\u6a21\u578b\u540d\u79f0'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='synclog',
            name='name',
            field=models.CharField(max_length=30),
        ),
    ]
