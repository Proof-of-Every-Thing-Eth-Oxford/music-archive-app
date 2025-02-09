// import { Field, Circuit, Bool } from 'o1js';

// /**
//  * A naive range-reduction to [-π, π] using repeated subtraction.
//  * We'll approximate pi ~ 3.14159. For better precision, store it as a rational.
//  *   piField = Field(314159).div(Field(100000))    // 3.14159
//  */
// const PI_NUM = Field(314159);    // numerator for 3.14159
// const PI_DEN = Field(100000);    // denominator for 3.14159
// function pi(): Field {
//   return PI_NUM.div(PI_DEN);
// }

// /**
//  * We'll do 2π ~ 6.28318 similarly:
//  */
// function twoPi(): Field {
//   return pi().mul(Field(2));
// }

// /**
//  * naiveRangeReduce(angle):
//  *   repeatedly subtract or add 2π until angle is in [-π, π].
//  * 
//  * WARNING: This is only "demonstration" code. Doing many subtractions
//  * in a circuit might blow up constraints if angle can be large.
//  */
// export function naiveRangeReduce(angle: Field): Field {
//   // We'll do at most, say, 5 or 6 sub/add cycles. 
//   // If the angle is *really* large, you might need more. 
//   for (let i = 0; i < 6; i++) {
//     // If angle > π, angle -= 2π
//     let condTooBig = angle.greaterThan(pi());
//     angle = Circuit.if(condTooBig, angle.sub(twoPi()), angle);

//     // If angle <= -π, angle += 2π
//     let condTooSmall = angle.lessThan(Field(0).sub(pi()));
//     angle = Circuit.if(condTooSmall, angle.add(twoPi()), angle);
//   }
//   return angle;
// }

// /**
//  * sinApprox(angle):
//  *   Approximates sin(angle) for angle in [-π, π] using 
//  *   a 7th-degree Maclaurin polynomial:
//  *
//  *   sin x ~ x - x^3/6 + x^5/120 - x^7/5040
//  *
//  *   We'll do a naive approach with Field division for each factorial.
//  */
// export function sinApprox(rawAngle: Field): Field {
//   // 1) reduce angle to [-π, π]
//   let angle = naiveRangeReduce(rawAngle);

//   // 2) polynomial 
//   //    x - x^3/6 + x^5/120 - x^7/5040
//   let x2 = angle.mul(angle); // x^2
//   let x3 = x2.mul(angle);    // x^3
//   let x5 = x3.mul(x2);       // x^5
//   let x7 = x5.mul(x2);       // x^7

//   // factorial denominators:
//   let fac3 = Field(6);       // 3! = 6
//   let fac5 = Field(120);     // 5! = 120
//   let fac7 = Field(5040);    // 7! = 5040

//   let term1 = angle;
//   let term3 = x3.div(fac3);
//   let term5 = x5.div(fac5);
//   let term7 = x7.div(fac7);

//   // sin x ~ x - x^3/6 + x^5/120 - x^7/5040
//   let sinX = term1
//     .sub(term3)
//     .add(term5)
//     .sub(term7);

//   return sinX;
// }

// /**
//  * cosApprox(angle):
//  *   We can approximate cos x using 
//  *   cos x = sin(x + π/2)  or a separate Maclaurin:
//  *   cos x ~ 1 - x^2/2 + x^4/24 - x^6/720 + ...
//  * 
//  *   Here we'll do cos x = sin(x + π/2).
//  */
// export function cosApprox(rawAngle: Field): Field {
//   let angleShifted = rawAngle.add(pi().div(Field(2)));  // x + π/2
//   return sinApprox(angleShifted);
// }


// import { Field, CircuitString, Circuit, Bool, Gadgets } from 'o1js';
// import { sinApprox } from './sinCosApprox';  // from the code above

// // We'll define a naive "mod 800" for ascii codes in [0..65535]
// function mod800(x: Field): Field {
//   let remainder = x;
//   for (let i = 0; i < 82; i++) {
//     let cond = remainder.greaterThanOrEqual(Field(800));
//     remainder = Circuit.if(cond, remainder.sub(Field(800)), remainder);
//   }
//   return remainder;
// }

// export function generateWavFromStringZk(
//   input: CircuitString
// ): Int16Array {
//   // We'll do the same audio parameters off-chain style
//   const sampleRate = 44100;
//   const durationPerTone = 0.1;
//   const samplesPerTone = Math.floor(sampleRate * durationPerTone);

//   const result = new Int16Array(input.toString().length * samplesPerTone);
//   let index = 0;

//   for (let char of input.toString()) {
//     // Turn ASCII code into a Field
//     let asciiF = Field(char.charCodeAt(0));

//     // frequency = 200 + (asciiF mod 800)
//     let remainder = mod800(asciiF);
//     let freqField = Field(200).add(remainder);

//     // Now we want to do: angle = 2π * freq * t
//     // But freq is up to 1000; t is up to ~ (samplesPerTone / sampleRate) ~ 0.1
//     // We'll do it off-circuit for each sample, or you can do:
//     for (let i = 0; i < samplesPerTone; i++) {
//       // off-circuit float for time
//       let t = i / sampleRate; 
//       // build an approximate circuit "angle" anyway:
//       //   angle = 2π * freq * t
//       // We'll do freq as a Field -> number. 
//       // If we insisted on purely circuit, we'd do Field(t * 1e6) etc. 
//       // But let's keep it simpler for demonstration:
//       let freqNum = Number(freqField.toBigInt());
//       let angleFloat = 2 * Math.PI * freqNum * t;
//       // We'll convert angleFloat => Field and run sinApprox
//       let angleField = Field(Math.floor(angleFloat * 1e6)).div(Field(1e6)); 
//       // That’s a “fixed-point” approach.

//       let s = sinApprox(angleField);  // circuit approximation of sin

//       // Now we do s * 32767, convert to a normal number for our final array.
//       // s is in [-1,1], approximately. Multiply by 32767 => scale
//       // In the circuit, s*32767 is also a Field. We can call .toBigInt() or .toJSNumber():
//       let sampleField = s.mul(Field(32767));
//       // For demonstration:
//       let sampleNum = Number(sampleField.toBigInt());
//       // clamp to int16
//       if (sampleNum > 32767) sampleNum = 32767;
//       if (sampleNum < -32768) sampleNum = -32768;

//       result[index++] = sampleNum;
//     }
//   }
//   return result;
// }