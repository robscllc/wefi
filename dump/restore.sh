#!/bin/bash

mongorestore -d meteor --port 3002 --dir dump/meteor/ --drop
