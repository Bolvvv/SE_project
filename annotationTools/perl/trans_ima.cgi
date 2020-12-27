#!/usr/bin/python3

import pydicom, os
import matplotlib.pyplot as plt
from scipy.misc import imsave

source_path = '/var/www/html/LabelMeAnnotationTool/SourceImages'
print("Content-type: text/html")
print()

def get_list_of_dirs(path):
    list_of_dirs = [os.path.join(path, item) for item in os.listdir(path) if os.path.isdir(os.path.join(path, item))]
    list_of_files = [os.path.join(path, item) for item in os.listdir(path) if not os.path.isdir(os.path.join(path, item))]
    for file in list_of_files:
        tmp_array = os.path.split(file)
        if tmp_array[1].find("IMA") > -1:
            #读取.dcm文件
            ds = pydicom.read_file(file)
            #提取图像信息
            img = ds.pixel_array
            imsave(file.replace("SourceImages", "Images").replace("IMA", "jpg"), img)

    for dir in list_of_dirs:
        if not os.path.isdir(dir.replace("SourceImages", "Images")):
            os.makedirs(dir.replace("SourceImages", "Images"))
        get_list_of_dirs(dir)
    return

get_list_of_dirs(source_path)