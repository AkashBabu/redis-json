import { expect } from 'chai';

import {
  parseKey, encodeKey, splitKey,
  // splitKey
} from '../../src/utils/key';

describe('#utils/key', () => {
  describe('#parseKey', () => {
    it('should return the given key as a number, if the string is a number', () => {
      const key = '1';

      expect(parseKey(key) === 1).to.be.true;
    });

    it('should decode the given key if it is a string and contains /.', () => {
      const key = 'hello/.world';
      expect(parseKey(key)).to.be.eql('hello.world');
    });

    it('should return the key as is if the key is a string and does not contain /.', () => {
      const key = 'helloworld';
      expect(parseKey(key)).to.be.eql('helloworld');
    });

    it('should return the given key as a string, if the key is a hex string', () => {
        const key = '0x1a2b3c';
        expect(parseKey(key)).to.be.eql('0x1a2b3c');
      });
  });

  describe('#encodeKey', () => {
    it('should replace all . with /.', () => {
      const key = 'hello.world';
      expect(encodeKey(key)).to.be.eq('hello/.world');
    });

    it('should return the string as is if it doesn\'t contain .', () => {
      const key = 'helloworld';
      expect(encodeKey(key)).to.be.eq('helloworld');
    });

    it('should encode / decode a key with /.', () => {
      const key = 'hello/.world';
      expect(parseKey(encodeKey(key))).to.be.eql(key);
    });
  });

  describe('#splitKey', () => {
    it('should return the string as is if it doesn\'t contain a .', () => {
      const key = 'hello';
      expect(splitKey(key)[0]).to.be.eq('hello');
    });

    it('should not split the string by /.', () => {
      const key = 'hello/.world';
      expect(splitKey(key)[0]).to.be.eq('hello/.world');
    });

    it('should split the string if it contains a .', () => {
      const key = 'hello.world';
      expect(splitKey(key)[0]).to.be.eq('hello');
      expect(splitKey(key)[1]).to.be.eq('world');
    });
  });
});
