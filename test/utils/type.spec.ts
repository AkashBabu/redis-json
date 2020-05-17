import { expect } from 'chai';

import { isSkippedType, getTypeOf, TYPE, getValueOf, getTypedVal } from '../../src/utils/type';

describe('#utils/type', () => {
  describe('#isSkippedType', () => {
    it('should return true if the given type has to be skipped', () => {
      const val = Symbol('hello');
      expect(isSkippedType(val)).to.be.true;
    });
    it('should return false if the given typeof val must not be skipped', () => {
      expect(isSkippedType(0)).to.be.false;
      expect(isSkippedType('1')).to.be.false;
      expect(isSkippedType(1)).to.be.false;
      expect(isSkippedType(null)).to.be.false;
      expect(isSkippedType(undefined)).to.be.false;
      expect(isSkippedType(false)).to.be.false;
      expect(isSkippedType(true)).to.be.false;
    });
  });

  describe('#getTypeOf', () => {
    it('should return correct type for boolean', () => {
      expect(getTypeOf(true)).to.be.eql(TYPE.BOOLEAN);
      expect(getTypeOf(false)).to.be.eql(TYPE.BOOLEAN);
    });
    it('should return correct type for string', () => {
      expect(getTypeOf('hello')).to.be.eql(TYPE.STRING);
      expect(getTypeOf('1')).to.be.eql(TYPE.STRING);
    });
    it('should return correct type for number', () => {
      expect(getTypeOf(123)).to.be.eql(TYPE.NUMBER);
      expect(getTypeOf(123.23)).to.be.eql(TYPE.NUMBER);
    });
    it('should return correct type for object', () => {
      expect(getTypeOf({})).to.be.eql(TYPE.OBJECT);
      expect(getTypeOf({ a: 1 })).to.be.eql(TYPE.OBJECT);
    });
    it('should return correct type for array', () => {
      expect(getTypeOf([])).to.be.eql(TYPE.OBJECT);
      expect(getTypeOf([1, 2, { a: 1 }])).to.be.eql(TYPE.OBJECT);
    });
    it('should return correct type for null', () => {
      expect(getTypeOf(null)).to.be.eql(TYPE.OBJECT);
    });
    it('should return correct type for undefined', () => {
      expect(getTypeOf(undefined)).to.be.eql(TYPE.UNDEFINED);
    });
    it('should return correct type for symbol', () => {
      expect(getTypeOf(Symbol('hello'))).to.be.eql(TYPE.SYMBOL);
    });
    it('should return correct type for custom class', () => {
      expect(getTypeOf(new Date())).to.be.eql('Date');
    });
  });

  describe('#getValueOf', () => {
    it('should return correct value for boolean', () => {
      expect(getValueOf(false)).to.be.eql('false');
      expect(getValueOf(true)).to.be.eql('true');
    });
    it('should return stringified value for string', () => {
      expect(getValueOf('hello')).to.be.eql('hello');
    });
    it('should return stringified value for number', () => {
      expect(getValueOf(123)).to.be.eql('123');
      expect(getValueOf(123.23)).to.be.eql('123.23');
      expect(getValueOf(0)).to.be.eql('0');
      expect(getValueOf(0.12)).to.be.eql('0.12');
    });
    it('should return stringified value for object', () => {
      expect(getValueOf({})).to.be.eql('{}');
      expect(getValueOf({ a: 1 })).to.be.eql('{"a":1}');
    });
    it('should return stringified value for array', () => {
      expect(getValueOf([])).to.be.eql('[]');
      expect(getValueOf([1, 2])).to.be.eql('[1,2]');
    });
    it('should return stringified value for null', () => {
      expect(getValueOf(null)).to.be.eql('null');
    });
    it('should return stringified value for undefined', () => {
      expect(getValueOf(undefined)).to.be.eql('undefined');
    });
    it('should return stringified value for symbol', () => {
      expect(getValueOf(Symbol('Hello'))).to.be.eql('Symbol(Hello)');
    });
    it('should return stringified value for custom class w/o stringifier', () => {
      const date = new Date();
      expect(getValueOf(date)).to.be.eql(String(date));
    });
    it('should return stringified value for custom class w/ stringifier', () => {
      const date = new Date();
      expect(getValueOf(date, {
        Date: (val) => val.toISOString(),
      })).to.be.eql(date.toISOString());
    });
  });

  describe('#getTypedVal', () => {
    it('should return correctly typed value for boolean', () => {
      expect(getTypedVal(TYPE.BOOLEAN, 'false')).to.be.eql(false);
      expect(getTypedVal(TYPE.BOOLEAN, 'true')).to.be.eql(true);
    });
    it('should return correctly typed value for string', () => {
      expect(getTypedVal(TYPE.STRING, 'hello')).to.be.eql('hello');
    });
    it('should return correctly typed value for number', () => {
      expect(getTypedVal(TYPE.NUMBER, '123')).to.be.eql(123);
      expect(getTypedVal(TYPE.NUMBER, '123.23')).to.be.eql(123.23);
      expect(getTypedVal(TYPE.NUMBER, '0')).to.be.eql(0);
      expect(getTypedVal(TYPE.NUMBER, '0.12')).to.be.eql(0.12);
    });
    it('should return correctly typed value for object', () => {
      expect(getTypedVal(TYPE.OBJECT, '{}')).to.be.an('object');
      expect(Object.keys(getTypedVal(TYPE.OBJECT, '{}')).length).to.be.eql(0);
    });
    it('should return correctly typed value for array', () => {
      expect(getTypedVal(TYPE.OBJECT, '[]')).to.be.an('array');
      expect(getTypedVal(TYPE.OBJECT, '[]').length).to.be.eql(0);
    });
    it('should return correctly typed value for null', () => {
      expect(getTypedVal(TYPE.OBJECT, 'null')).to.be.eql(null);
    });
    it('should return correctly typed value for undefined', () => {
      expect(getTypedVal(TYPE.UNDEFINED, 'undefined')).to.be.eql(undefined);
    });
    it('should return correctly typed value for symbol', () => {
      expect(getTypedVal(TYPE.SYMBOL, 'Symbol(hello)')).to.be.eql('Symbol(hello)');
    });
    it('should return correctly typed value for custom class w/o parser', () => {
      const date = new Date();
      expect(getTypedVal('Date', String(date))).to.be.eql(String(date));
    });
    it('should return correctly typed value for custom class w/ parser', () => {
      const date = new Date();
      const retrievedDate = getTypedVal('Date', date.toISOString(), {
        Date: val => new Date(val),
      });
      expect(date.getTime() - retrievedDate.getTime()).to.be.eql(0);
    });
  });
});
