*** Settings ***
Documentation     สถานะและการดึงข้อมูล (TC-DATA-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        data

*** Test Cases ***
TC-DATA-01 แสดงสถานะ 'สด' เมื่อดึงข้อมูลสำเร็จ
    [Tags]    smoke    TC-DATA-01
    Open App And Wait For Live
    Get Attribute    ${STATUS}    class    *=    live
    Get Text    ${STATUS}    *=    อัปเดต

TC-DATA-02 ใช้ข้อมูลสำรองเมื่อ API ล้มเหลว
    [Tags]    smoke    TC-DATA-02
    Set Mock Failure    True
    Open App
    Wait For Offline Status
    Get Attribute    ${STATUS}    class    *=    off
    Result Should Be    33,500 THB

TC-DATA-04 ปุ่มรีเฟรชดึงอัตราใหม่
    [Tags]    smoke    TC-DATA-04
    Open App And Wait For Live
    Set Mock Rates    THB=36
    Click Refresh
    Result Should Be    36,000 THB
    ${hits}=    Get Mock Hits
    Should Be True    ${hits} >= 2
