const arr = [];
for (let i = 0; i < 10; i++) {
    arr.push(`name${i}`);
}


bench([
    function normalLoop() {
        for (let i = 0; i < arr.length; i++) {}
    },
    function reverseLoop() {
        let i = arr.length - 1;
        while (i-- > -1) {}
    },
    function nativeLoop() {
        arr.forEach(e => e);
    },
], {
    runs: 100,
});
