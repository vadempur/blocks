import { IntegrationTester } from './integration-tests';

async function runTests() {
  console.log('🧪 BLOCKCHAIN INTEGRATION TESTS');
  console.log('='.repeat(60));

  const tester = new IntegrationTester();

  try {
    await tester.runAllTests();
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

export { runTests };
