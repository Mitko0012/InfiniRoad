const T_INTERSECTION = Object.freeze({
    roadsCount: 3,
    options: 2,
    road0: {
        entryPoint: [0, -1.7],
        exitPoint: [0, -1.7],
        decidingPoint: [0, -0.3],
        0: [0, 1.3], 
        1: [0.6, 0],
        index0: 1,
        index1: 2
    },
    road1: {
        entryPoint: [0, 1.7],
        exitPoint: [0, 1.7],
        decidingPoint: [0, 0.3],
        0: [0, -1.3],
        1: [0.6, 0],
        index0: 0,
        index1: 2
    },
    road2: {
        entryPoint: [1.7, 0],
        exitPoint: [1.7, 0],
        decidingPoint: [1.65, 0],
        0: [-0.2, 0],
        1: [0.0, 0],
        index0: 0,
        index1: 1
    }
});