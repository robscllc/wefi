#!/bin/bash

mongorestore -d meteor --port 3002 --dir $@ --drop
