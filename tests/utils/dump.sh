#!/bin/bash

mongodump -d meteor --port 3002 -o $@
