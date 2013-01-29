#!/bin/bash

mongorestore -d meteor --port 3002 --dir tests/dump/meteor/ --drop
