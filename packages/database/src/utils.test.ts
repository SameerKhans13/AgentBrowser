import { calculateCenter, formatDuration, parseActionParameters } from './utils';

function testCalculateCenter() {
  const bbox = { x: 100, y: 200, width: 50, height: 80 };
  const center = calculateCenter(bbox);

  if (center.x !== 125 || center.y !== 240) {
    throw new Error(`calculateCenter failed: expected {x: 125, y: 240}, got ${JSON.stringify(center)}`);
  }
  console.log('✅ testCalculateCenter passed!');
}

function testFormatDuration() {
  const short = formatDuration(450);
  const long = formatDuration(2300);

  if (short !== '450ms') {
    throw new Error(`formatDuration failed for short: expected "450ms", got "${short}"`);
  }
  if (long !== '2.3s') {
    throw new Error(`formatDuration failed for long: expected "2.3s", got "${long}"`);
  }
  console.log('✅ testFormatDuration passed!');
}

function testParseActionParameters() {
  const parsedStr = parseActionParameters('{"clickCount": 2}');
  const parsedObj = parseActionParameters({ clickCount: 2 });
  const parsedNull = parseActionParameters(null);

  if ((parsedStr as any).clickCount !== 2) {
    throw new Error(`parseActionParameters failed for string: expected 2, got ${JSON.stringify(parsedStr)}`);
  }
  if ((parsedObj as any).clickCount !== 2) {
    throw new Error(`parseActionParameters failed for object: expected 2, got ${JSON.stringify(parsedObj)}`);
  }
  if (Object.keys(parsedNull).length !== 0) {
    throw new Error(`parseActionParameters failed for null: expected empty object, got ${JSON.stringify(parsedNull)}`);
  }
  console.log('✅ testParseActionParameters passed!');
}

function runAll() {
  console.log('🧪 Running all database utilities unit tests...');
  try {
    testCalculateCenter();
    testFormatDuration();
    testParseActionParameters();
    console.log('🎉 All utility tests passed successfully!');
  } catch (error) {
    console.error('❌ Test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this is executed directly
runAll();
