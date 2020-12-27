#!/usr/bin/python3

import os, sys, json
path="/var/www/html/LabelMeAnnotationTool/Images"
tmp_path = path
print("Content-type: text/html")
print()
# print('[{"text":"123","a_attr": { "href": "tool?collection=LabelMe&mode=f&folder=testFolder/test&image=test1.jpg"}}]')

def get_list_of_dirs(path):
    output_dictonary = {}
    list_of_dirs = [os.path.join(path, item) for item in os.listdir(path) if os.path.isdir(os.path.join(path, item))]
    list_of_files = [os.path.join(path, item) for item in os.listdir(path) if not os.path.isdir(os.path.join(path, item))]
    output_dictonary["text"] = path.replace(tmp_path, "")
    output_dictonary["type"] = "directory"
    output_dictonary["children"] = []
    for file in list_of_files:
        output_file = {}
        a_attr = {}
        tmp_array = os.path.split(file)
        output_file["text"] = file.replace(file,tmp_array[1])
        a_attr["href"] = "tool?collection=LabelMe&mode=f&folder="+tmp_array[0].replace(tmp_path,"")+"&image="+tmp_array[1]
        output_file["a_attr"] = a_attr
        output_file["type"] = "file"
        output_dictonary["children"].append(output_file)

    for dir in list_of_dirs:
        output_dictonary["children"].append(get_list_of_dirs(dir))
    return output_dictonary

print(json.dumps(get_list_of_dirs(path)))