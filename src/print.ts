import { Port } from "./ir1/ports/port";
import * as Types from "./ir1/types";
import * as Values from "./ir1/values";

const maxLength = 10;

function printValue(value: Values.ReadyValue, print: (s: string) => void) {
  if (value instanceof Values.Integer || value instanceof Values.Float ||
      value instanceof Values.Boolean || value instanceof Values.ErrorValue) {
    print(String(value.value));
    return;
  }
  if (value instanceof Values.StreamElement) {
    printValue(value.value, print);
    return;
  }
  if (value instanceof Values.Function) {
    print("{function_body}");
    return;
  }
  if (value instanceof Values.Array || value instanceof Values.CompleteStream) {
    trimmedPrint(value.values, print);
    return;
  }
  if (value instanceof Values.Record) {
    const values: Values.ReadyValue[] = [];
    value.values.forEach((v: Values.ReadyValue, key: string) => {
      values.push(v);
    });
    trimmedPrint(values, print);
    return;
  }
}

function trimmedPrint(values: Values.ReadyValue[], print: (s: string) => void) {
  let count = 0;
  print("{");
  for (const value of values) {
    if (count > 0) {
      print(", ");
    }

    printValue(value, print);
    count++;

    if (count >= maxLength) {
      print(", ...");
      break;
    }
  }
  print("}");
}

export function printPortData(input: Port, print: (s: string) => void) {
  const value = input.getData(new Types.Some());
  print(value.type.toString() + " = ");

  if (value instanceof Values.StreamElement || value instanceof Values.StreamEnd) {
    const values = [value];
    let count = 0;
    while (!(values[values.length - 1] instanceof Values.StreamEnd) && values.length <= maxLength) {
      values.push(input.getData(new Types.Some(), ++count));
    }
    trimmedPrint(values, print);
    return;
  }
  printValue(value, print);
}
