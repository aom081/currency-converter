*** Settings ***
Documentation     ธีม (TC-THEME-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        theme

*** Variables ***
${DARK_BG}        rgb(14, 16, 32)
${LIGHT_BG}       rgb(246, 247, 251)

*** Test Cases ***
TC-THEME-01 ค่าเริ่มต้นคือ 'ตามระบบ'
    [Tags]    smoke    TC-THEME-01
    Open App And Wait For Live
    Get Attribute    css=[data-theme-set="auto"]    aria-pressed    ==    true
    Get Attribute    css=[data-theme-set="dark"]    aria-pressed    ==    false
    Get Attribute    css=html    data-theme    validate    value is None
    Body Background Should Be    ${LIGHT_BG}

TC-THEME-02 เลือกธีมมืด
    [Tags]    smoke    TC-THEME-02
    Open App And Wait For Live
    Choose Theme    dark
    Theme Attribute Should Be    dark
    Get Attribute    css=[data-theme-set="dark"]    aria-pressed    ==    true
    Body Background Should Be    ${DARK_BG}

TC-THEME-03 เลือกมืดแล้วกลับเป็นธีมสว่าง
    [Tags]    TC-THEME-03
    Open App And Wait For Live
    Choose Theme    dark
    Choose Theme    light
    Theme Attribute Should Be    light
    Body Background Should Be    ${LIGHT_BG}

TC-THEME-04 จำธีมที่เลือกหลังรีโหลด
    [Tags]    TC-THEME-04
    Open App And Wait For Live
    Choose Theme    dark
    Reload
    Wait For Live Status
    Theme Attribute Should Be    dark
    Get Attribute    css=[data-theme-set="dark"]    aria-pressed    ==    true
    Body Background Should Be    ${DARK_BG}

TC-THEME-05 'ตามระบบ' ใช้ธีมมืดเมื่อระบบเป็นโหมดมืด
    [Tags]    TC-THEME-05
    Open App And Wait For Live    dark
    Get Attribute    css=html    data-theme    validate    value is None
    Body Background Should Be    ${DARK_BG}

TC-THEME-06 เลือกเอง ชนะโหมดของระบบ
    [Tags]    TC-THEME-06
    Open App And Wait For Live    dark
    Choose Theme    light
    Body Background Should Be    ${LIGHT_BG}
    Choose Theme    auto
    Body Background Should Be    ${DARK_BG}
