# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home_application', '0005_auto_20190805_1138'),
    ]

    operations = [
        migrations.AddField(
            model_name='apply',
            name='cloud_id',
            field=models.CharField(default=b'0', max_length=10),
        ),
        migrations.AddField(
            model_name='ippools',
            name='cloud_id',
            field=models.CharField(default=b'0', max_length=10),
        ),
    ]
