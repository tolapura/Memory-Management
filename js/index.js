function Memory(b, s) {
    this.block = parseInt(b, 10);
    this.size = parseInt(s, 10);
    this.queue = [];
    this.totalTime = 0;
    this.queueLength = 0;
    this.free = true;
}

function Job(n, t, s) {
    this.number = parseInt(n, 10);
    this.time = parseInt(t, 10);
    this.jsize = parseInt(s, 10);
    this.internalFragmentation = 0;
    this.waitingTime = 0;
}

var app = new Vue({
    el: '#app',
    data: {
        jobs: '',
        partitions: '',
        firstFitJobs: '',
        firstFitParts: '',
        worstFitJobs: '',
        worstFitParts: '',
        bestFitJobs: '',
        bestFitParts: '',
    },
    methods: {
        run: function() {
            this.firstFitJobs = JSON.parse(JSON.stringify(this.jobs));
            this.worstFitJobs = JSON.parse(JSON.stringify(this.jobs));
            this.bestFitJobs = JSON.parse(JSON.stringify(this.jobs));

            this.firstFitParts = JSON.parse(JSON.stringify(this.partitions));
            this.worstFitParts = JSON.parse(JSON.stringify(this.partitions));
            this.bestFitParts = JSON.parse(JSON.stringify(this.partitions));
            
            console.log('First Fit');
            this.firstFitParts = this.compute(this.firstFitJobs,this.firstFitParts);
            this.throughput(this.firstFitParts);
            this.storageUtilization(this.firstFitParts);
            
            this.worstFitParts.sort(this.sortBySizeDes);
            console.log('Worst Fit');
            this.worstFitParts = this.compute(this.worstFitJobs,this.worstFitParts);
            this.throughput(this.worstFitParts);
            this.storageUtilization(this.worstFitParts);

            this.bestFitParts.sort(this.sortBySizeAsc);
            console.log('Best Fit');
            this.bestFitParts = this.compute(this.bestFitJobs,this.bestFitParts);
            this.throughput(this.bestFitParts);
            this.storageUtilization(this.bestFitParts);
        },
        storageUtilization: function (arr) {
            console.log('-----------------------------');
            console.log('Storage Utilization');
            arr.sort(this.sortByBlockAsc);
            for (var i = 0; i < arr.length; i++) {
                var strgUtil = arr[i].queueLength / this.jobs.length * 100;
                console.log(`Block #${arr[i].block}: ${strgUtil}%`);
            }
        },
        throughput: function (arr) {
            console.log('-----------------------------');
            console.log('Throughput');
            var totalJobs = 0;
            arr.sort(this.sortByTotalTimeDes);
            for (var i = 1; i < arr[0].totalTime; i++) {
                var ctr = 0;
                for (var j = 0; j < arr.length; j++) {
                    if(arr[j].totalTime > i) {
                        ctr++;
                    }
                }
                totalJobs += ctr;
                console.log(`${i}s -> ${ctr} jobs processed.`);
            }
            var avethrPt = totalJobs / arr[0].totalTime;
            console.log(`Average throughput is ${avethrPt}`);
        },
        compute: function(j, p) {
            for (var i = 0; i < j.length; i++) {
                var block = -1;
                var time = -1;
                for (var k = 0; k < p.length; k++) {
                    if (p[k].size >= j[i].jsize) {
                        if (time == -1 || p[k].totalTime < time) {
                            time = p[k].totalTime;
                            block = k;
                            if (time == 0) {
                                break;
                            }
                        }
                    }
                }
                if (block != -1) {
                    var intrlFrag = p[block].size - j[i].jsize;
                    j[i].internalFragmentation = intrlFrag;
                    j[i].waitingTime = time;
                    p[block].queue.push(j[i]);
                    p[block].queueLength++;
                    p[block].totalTime += j[i].time;
                }
            }

            for (var i = 0; i < p.length; i++) {
                console.log('---------------------------');
                console.log(`Memory Block: ${p[i].block} == ${p[i].queueLength} jobs.`);
                for (var j = 0; j < p[i].queue.length; j++) {
                    console.log(`Job ${p[i].queue[j].number} | Waiting time is ${p[i].queue[j].waitingTime} | IF -> ${p[i].queue[j].internalFragmentation}`);
                    // console.log(`Waiting Time ${p[i].queue[j].waitingTime}`);
                    // console.log(`Internal Fragment ${p[i].queue[j].internalFragmentation}`);
                }
            };
            return p;
        },
        sortBySizeAsc: function(a, b) {
            return a.size - b.size;
        },
        sortBySizeDes: function(a, b) {
            return b.size - a.size;
        },
        sortByTotalTimeDes: function(a, b) {
            return b.totalTime - a.totalTime;
        },
        sortByBlockAsc: function(a, b) {
            return a.block - b.block;
        },
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // This is for input file reading
    var jobs = document.getElementById("jobs");
    var partitions = document.getElementById("partitions");

    jobs.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            var myFile = this.files[0];
            var reader = new FileReader();

            reader.addEventListener('load', function(e) {
                var file = e.target.result;
                var fields = file.split(",");
                var data = [];
                for (var i = 0; i < fields.length; i += 3) {
                    data.push(new Job(
                        fields[i], fields[i + 1], fields[i + 2]
                    ));
                }
                app.jobs = data.slice(0);

            });
            reader.readAsBinaryString(myFile);
        }
    });

    partitions.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            var myFile = this.files[0];
            var reader = new FileReader();

            reader.addEventListener('load', function(e) {
                var file = e.target.result;
                var fields = file.split(",");
                var data = [];
                for (var i = 0; i < fields.length; i += 2) {
                    data.push(new Memory(
                        fields[i], fields[i + 1]
                    ));
                }
                app.partitions = data.slice(0);
            });
            reader.readAsBinaryString(myFile);
        }
    });
});