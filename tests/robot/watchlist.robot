*** Settings ***
Documentation     รายการที่ติดตาม (TC-WATCH-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        watchlist

*** Test Cases ***
TC-WATCH-01 เริ่มต้นแสดงข้อความว่าง
    [Tags]    smoke    TC-WATCH-01
    Open App And Wait For Live
    Get Text    ${WATCH_EMPTY}    *=    ยังไม่มีสกุลเงินที่ติดตาม

TC-WATCH-02 กดดาวเพื่อติดตามแล้วขึ้นการ์ด
    [Tags]    smoke    TC-WATCH-02
    Open App And Wait For Live
    Star From List    JPY
    Get Element Count    ${CARD}    ==    1
    Get Text    ${CARD}    *=    JPY
    Get Text    ${CARD_RATE}    *=    0.233333

TC-WATCH-03 เลิกติดตามจากการ์ด
    [Tags]    TC-WATCH-03
    Open App And Wait For Live
    Star From List    JPY
    Unstar From Card    JPY
    Get Element Count    ${CARD}    ==    0
    Get Text    ${WATCH_EMPTY}    *=    ยังไม่มีสกุลเงินที่ติดตาม

TC-WATCH-04 รายการติดตามคงอยู่หลังรีโหลดหน้า
    [Tags]    TC-WATCH-04
    Open App And Wait For Live
    Star From List    EUR
    Reload
    Wait For Live Status
    Get Element Count    ${CARD}    ==    1
    Get Text    ${CARD}    *=    EUR

TC-WATCH-05 สกุลเงินแข็งค่าขึ้น แสดง ▲
    [Tags]    smoke    TC-WATCH-05
    Open App And Wait For Live
    Star From List    JPY
    Set Mock Rates    JPY=140
    Click Refresh
    Get Text    ${DELTA_LAST}    ==    ▲ ล่าสุด +7.143%
    Get Text    ${DELTA_SINCE}    ==    ▲ ตั้งแต่ติดตาม +7.143%
    Get Attribute    ${DELTA_LAST}    class    *=    up

TC-WATCH-06 สกุลเงินอ่อนค่าลง แสดง ▼
    [Tags]    TC-WATCH-06
    Open App And Wait For Live
    Star From List    JPY
    Set Mock Rates    JPY=160
    Click Refresh
    Get Text    ${DELTA_LAST}    ==    ▼ ล่าสุด -6.250%
    Get Attribute    ${DELTA_LAST}    class    *=    down

TC-WATCH-08 เปลี่ยนสกุลฐานแล้วอัตราในการ์ดเปลี่ยนตาม
    [Tags]    TC-WATCH-08
    Open App And Wait For Live
    Star From List    JPY
    Select Options By    ${BASE}    value    USD
    Get Text    ${CARD_RATE}    *=    0.006667

TC-WATCH-10 ติดตามหลายสกุลพร้อมกัน
    [Tags]    TC-WATCH-10
    Open App And Wait For Live
    Star From List    JPY
    Star From List    EUR
    Star From List    GBP
    Get Element Count    ${CARD}    ==    3
