# createDummyFiles.sh

#!/bin/bash

# 폴더 생성
mkdir -p ./__tests__/files/test3

# 대용량 파일 생성 (5GB)
dd if=/dev/zero of=./__tests__/files/test3/large.txt bs=1024 count=5000000