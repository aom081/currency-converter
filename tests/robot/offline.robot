*** Settings ***
Documentation     ใช้งานออฟไลน์ (TC-OFFLINE-*) และการติดตั้งเป็นแอป (TC-PWA-01)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        offline

*** Test Cases ***
TC-OFFLINE-01 ออฟไลน์แล้วใช้อัตราล่าสุดที่เคยบันทึกไว้
    [Tags]    smoke    TC-OFFLINE-01
    Open App And Wait For Live
    Set Mock Failure    True
    Reload
    Wait For Offline Status
    Get Text    ${STATUS}    *=    บันทึกไว้
    Result Should Be    35,000 THB

TC-OFFLINE-02 ไม่เคยมีข้อมูลสด ใช้อัตราตัวอย่าง
    [Tags]    TC-OFFLINE-02
    Set Mock Failure    True
    Open App
    Wait For Offline Status
    Get Text    ${STATUS}    *=    ข้อมูลตัวอย่าง
    Result Should Be    33,500 THB

TC-PWA-01 มี manifest ที่ติดตั้งเป็นแอปได้
    [Documentation]    ส่วน service worker และการเปิดออฟไลน์ ทดสอบใน Playwright (npm run test:e2e:pwa)
    [Tags]    TC-PWA-01
    Open App And Wait For Live
    Get Attribute    css=link[rel="manifest"]    href    *=    manifest.webmanifest
    Get Attribute    css=meta[name="theme-color"]    content    ^=    \#
