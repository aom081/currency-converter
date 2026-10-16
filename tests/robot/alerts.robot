*** Settings ***
Documentation     แจ้งเตือนราคาเป้าหมาย (TC-ALERT-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        alerts

*** Keywords ***
Open With JPY Watched
    [Documentation]    เปิดแอปและติดตาม JPY (JPY/THB เริ่มต้น = 35/150 = 0.233333)
    Open App And Wait For Live
    Star From List    JPY

*** Test Cases ***
TC-ALERT-01 การ์ดที่ติดตามมีฟอร์มตั้งแจ้งเตือน
    [Tags]    smoke    TC-ALERT-01
    Open With JPY Watched
    Get Element States    css=[data-al-dir="JPY"]    contains    visible
    Get Element States    css=[data-al-target="JPY"]    contains    visible
    Get Element States    css=[data-al-set="JPY"]    contains    visible

TC-ALERT-02 เป้าหมายว่างหรือ 0 แสดงข้อผิดพลาด
    [Tags]    TC-ALERT-02
    Open With JPY Watched
    Click    css=[data-al-set="JPY"]
    Get Text    css=[data-al-err="JPY"]    *=    กรุณากรอกราคาเป้าหมาย
    Fill Text    css=[data-al-target="JPY"]    0
    Click    css=[data-al-set="JPY"]
    Get Text    css=[data-al-err="JPY"]    *=    กรุณากรอกราคาเป้าหมาย
    Get Element Count    ${ALERT_STATE}    ==    0

TC-ALERT-03 ตั้งแจ้งเตือนแล้วแสดงเงื่อนไข
    [Tags]    smoke    TC-ALERT-03
    Open With JPY Watched
    Set Alert    JPY    above    0.24
    Get Text    ${ALERT_STATE}    *=    ≥ 0.24 THB

TC-ALERT-05 เรทสูงถึงเป้าหมาย แจ้งเตือนและทำเครื่องหมาย
    [Tags]    smoke    TC-ALERT-05
    Open With JPY Watched
    Set Alert    JPY    above    0.24
    Set Mock Rates    JPY=140
    Refresh And Wait
    Get Element Count    ${TOASTS}    ==    1
    Get Text    ${TOASTS}    *=    JPY/THB
    Get Text    ${TOASTS}    *=    สูงกว่า
    Get Text    ${ALERT_STATE}    *=    ถึงเป้าหมายแล้ว
    Get Attribute    ${ALERT_STATE}    class    *=    hit

TC-ALERT-06 เรทต่ำถึงเป้าหมาย แจ้งเตือน
    [Tags]    TC-ALERT-06
    Open With JPY Watched
    Set Alert    JPY    below    0.23
    Get Text    ${ALERT_STATE}    *=    ≤ 0.23 THB
    Set Mock Rates    JPY=160
    Refresh And Wait
    Get Text    ${TOASTS}    *=    ต่ำกว่า
    Get Text    ${ALERT_STATE}    *=    ถึงเป้าหมายแล้ว

TC-ALERT-08 ลบแจ้งเตือนแล้วกลับเป็นฟอร์ม
    [Tags]    TC-ALERT-08
    Open With JPY Watched
    Set Alert    JPY    above    0.24
    Click    css=[data-al-clear="JPY"]
    Get Element Count    ${ALERT_STATE}    ==    0
    Get Element States    css=[data-al-set="JPY"]    contains    visible

TC-ALERT-09 แจ้งเตือนคงอยู่หลังรีโหลด
    [Tags]    TC-ALERT-09
    Open With JPY Watched
    Set Alert    JPY    above    0.24
    Reload
    Wait For Live Status
    Get Text    ${ALERT_STATE}    *=    ≥ 0.24 THB

TC-ALERT-11 ข้อมูลตัวอย่างตอนออฟไลน์ไม่ทริกเกอร์ และทริกเกอร์เมื่อได้ข้อมูลสด
    [Tags]    TC-ALERT-11
    Set Mock Failure    True
    Open App
    Wait For Offline Status
    Star From List    JPY
    Set Alert    JPY    below    0.23
    Get Text    ${ALERT_STATE}    *=    ≤ 0.23 THB
    Get Element Count    ${TOASTS}    ==    0
    Set Mock Failure    False
    Set Mock Rates    THB=34
    Click Refresh
    Wait For Live Status
    Get Element Count    ${TOASTS}    ==    1
    Get Text    ${ALERT_STATE}    *=    ถึงเป้าหมายแล้ว
