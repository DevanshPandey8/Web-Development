// EPLQ System Test File
// Open browser console and run: testEPLQSystem()

function testEPLQSystem() {
    console.log('🧪 Testing EPLQ System Components...\n');
    
    // Test 1: Check if modules are loaded
    console.log('1. Module Loading Test:');
    console.log('   ✓ Firebase App:', window.firebaseApp ? '✅ Loaded' : '❌ Missing');
    console.log('   ✓ Encryption:', window.eplqEncryption ? '✅ Loaded' : '❌ Missing');
    console.log('   ✓ Auth:', window.eplqAuth ? '✅ Loaded' : '❌ Missing');
    console.log('   ✓ Admin Module:', window.adminModule ? '✅ Loaded' : '❌ Missing');
    console.log('   ✓ User Module:', window.userModule ? '✅ Loaded' : '❌ Missing');
    console.log('   ✓ Main App:', window.eplqApp ? '✅ Loaded' : '❌ Missing');
    
    // Test 2: Check Firebase configuration
    console.log('\n2. Firebase Configuration Test:');
    if (window.firebaseApp) {
        const config = firebase.app().options;
        console.log('   ✓ API Key:', config.apiKey.includes('your-api-key') ? '❌ Not configured' : '✅ Configured');
        console.log('   ✓ Project ID:', config.projectId.includes('your-project') ? '❌ Not configured' : '✅ Configured');
        console.log('   ✓ Auth Domain:', config.authDomain.includes('your-project') ? '❌ Not configured' : '✅ Configured');
    } else {
        console.log('   ❌ Firebase not initialized');
    }
    
    // Test 3: Check Web Crypto API
    console.log('\n3. Encryption Support Test:');
    console.log('   ✓ Web Crypto API:', window.crypto && window.crypto.subtle ? '✅ Supported' : '❌ Not supported');
    console.log('   ✓ AES-GCM:', window.crypto?.subtle ? '✅ Available' : '❌ Not available');
    
    // Test 4: Test basic encryption
    console.log('\n4. Encryption Function Test:');
    if (window.eplqEncryption) {
        testEncryption();
    } else {
        console.log('   ❌ Encryption module not loaded');
    }
    
    // Test 5: Check UI components
    console.log('\n5. UI Components Test:');
    console.log('   ✓ Navigation:', document.querySelectorAll('.nav-btn').length > 0 ? '✅ Present' : '❌ Missing');
    console.log('   ✓ Admin Forms:', document.getElementById('adminLoginForm') ? '✅ Present' : '❌ Missing');
    console.log('   ✓ User Forms:', document.getElementById('userLoginForm') ? '✅ Present' : '❌ Missing');
    console.log('   ✓ Password Reset:', document.getElementById('passwordResetModal') ? '✅ Present' : '❌ Missing');
    console.log('   ✓ Forgot Password Buttons:', document.querySelectorAll('.forgot-btn').length === 2 ? '✅ Present' : '❌ Missing');
    
    console.log('\n🎯 Test Complete! Check results above.');
    console.log('💡 If any tests fail, check SETUP-CHECKLIST.md for solutions.');
    console.log('🔑 Password reset is now available on both Admin and User login forms!');
}

async function testEncryption() {
    try {
        const testLat = 40.7589;
        const testLng = -73.9851;
        
        console.log('   → Testing encryption...');
        const encrypted = await window.eplqEncryption.encryptLocation(testLat, testLng);
        console.log('   ✓ Encryption: ✅ Success');
        
        console.log('   → Testing decryption...');
        const decrypted = await window.eplqEncryption.decryptLocation(encrypted);
        console.log('   ✓ Decryption: ✅ Success');
        
        console.log('   → Verifying data integrity...');
        const latMatch = Math.abs(decrypted.lat - testLat) < 0.000001;
        const lngMatch = Math.abs(decrypted.lng - testLng) < 0.000001;
        console.log('   ✓ Data Integrity:', (latMatch && lngMatch) ? '✅ Preserved' : '❌ Corrupted');
        
    } catch (error) {
        console.log('   ❌ Encryption test failed:', error.message);
    }
}

// Auto-run test when page loads (with delay for modules to load)
setTimeout(() => {
    if (window.location.hash === '#test') {
        testEPLQSystem();
    }
}, 2000);

// Quick search test function
async function testSearchFunctionality() {
    console.log('\n🔍 Testing Search Functionality...');
    
    if (!window.userModule) {
        console.log('❌ User module not loaded');
        return;
    }
    
    console.log('Loading demo data...');
    await window.userModule.loadDemoData();
    
    console.log('Testing spatial query...');
    const results = await window.userModule.performSpatialQuery(40.7580, -73.9850, 5, '');
    
    console.log(`✅ Search test completed: Found ${results.length} POIs`);
    console.log('Results:', results);
}

console.log('🧪 EPLQ Test Suite Loaded');
console.log('💡 Run testEPLQSystem() to check system status');
console.log('🔍 Run testSearchFunctionality() to test search features');
console.log('🔗 Or add #test to URL to auto-run tests');
