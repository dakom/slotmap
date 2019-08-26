import Benchmark from "benchmark";
import {create_slotmap, SlotMap, MAX_ID} from "../lib/lib";
import {unwrap_get, unwrap_get_native, unwrap_either, prep_mock_data, multiply_mat4, fromRotationTranslationScale, Matrix4, Translation, Rotation, Scale, Velocity, Material, Collider, ACTIVE, TRANSLATION, ROTATION, SCALE, LOCAL_MATRIX, WORLD_MATRIX, VELOCITY, MATERIAL, COLLIDER, simulate_quick_either} from "./benchmark-helpers";

/*
 * the idea behind the benchmark is to simulate a real-world situation
 * where data is grouped by entity, and processed according to business-logic
 */

const [slotmap, nativemap] = prep_mock_data();

const slotmap_bench_values= () => {

    //TOGGLE IS_ACTIVE IMMUTABLY
    slotmap.update<[boolean]>(([isActive], _key) => {
        return [!isActive]
    }, [ACTIVE]);


    //UPDATE LOCAL POSITIONS IMMUTABLY
    slotmap.update<[Translation, Rotation, Scale]>(([t,r,s], _key) => {

        const translation = {
            x: t.x + 1,
            y: t.y + 1,
            z: t.z + 1,
        }

        const rotation = {
            x: r.x + 1,
            y: r.y + 1,
            z: r.z + 1,
            w: r.w + 1,
        }

        const scale = {
            x: s.x + 1,
            y: s.y + 1,
            z: s.z + 1,
        }

        return [translation, rotation, scale];
    }, [TRANSLATION, ROTATION, SCALE]);


    //UPDATE LOCAL MATRIX VIA RW
    slotmap.update_rw<[Translation, Rotation, Scale], [Matrix4]>(([t,r,s], _key) => {

        const local_matrix = fromRotationTranslationScale(r, t, s);
        return [local_matrix];
    }, [TRANSLATION, ROTATION, SCALE], [LOCAL_MATRIX]);


    //UPDATE WORLD MATRIX VIA RW
    slotmap.update_rw<[Matrix4], [Matrix4]>(([local_matrix], _key) => {

        const world_matrix = multiply_mat4(local_matrix, local_matrix);
        return [local_matrix];
    }, [LOCAL_MATRIX], [WORLD_MATRIX]);
       

    //UPDATE PHYSICS MUTABLY
    for(const [velocity, collider] of unwrap_either(slotmap.values<[Velocity,Collider]>([VELOCITY, COLLIDER]))) {
        velocity.x *= 1;
        velocity.y *= 1;
        velocity.z *= 1;

        collider.center.x -= 1;
        collider.center.y -= 1;
        collider.center.z -= 1;
    }

    //Update material partially, immutably
    slotmap.update<[Material]>(([material], _key) => {
        const new_material = {alpha: !material.alpha, ...material};
        return [new_material];
    }, [MATERIAL]);
}

const slotmap_bench_keys = () => {
    //console.log("running slotmap tests for", slotmap.length(), "entities");
    for(const key of slotmap.keys) {

        //TOGGLE IS_ACTIVE IMMUTABLY
        const [isActive] = unwrap_get(slotmap.get(key, [ACTIVE])) as [boolean];

        slotmap.replace(key, [
            [ACTIVE, !isActive]
        ]);

        //UPDATE LOCAL POSITIONS IMMUTABLY
        const [t, r, s] = unwrap_get(slotmap.get(key, [TRANSLATION, ROTATION, SCALE])) as [Translation, Rotation, Scale];
        const translation = {
            x: t.x + 1,
            y: t.y + 1,
            z: t.z + 1,
        }

        const rotation = {
            x: r.x + 1,
            y: r.y + 1,
            z: r.z + 1,
            w: r.w + 1,
        }

        const scale = {
            x: s.x + 1,
            y: s.y + 1,
            z: s.z + 1,
        }
        
        slotmap.replace(key, [
            [TRANSLATION, translation],
            [ROTATION, rotation],
            [SCALE, scale],
        ]);

        //UPDATE LOCAL MATRIX IMMUTABLY
        const [t2, r2, s2] = unwrap_get(slotmap.get(key, [TRANSLATION, ROTATION, SCALE])) as [Translation, Rotation, Scale];
        const local_matrix = fromRotationTranslationScale(rotation, translation, scale);
        slotmap.replace(key, [
            [LOCAL_MATRIX, local_matrix],
        ]);
       

        //UPDATE WORLD TRANSFORMS IMMUTABLY
        const [local_matrix_2] = unwrap_get(slotmap.get(key, [LOCAL_MATRIX])) as [Matrix4];
        const world_matrix = multiply_mat4(local_matrix_2, local_matrix_2);

        slotmap.replace(key, [
            [WORLD_MATRIX, world_matrix]
        ]);


        //UPDATE PHYSICS MUTABLY
        const [velocity, collider] = unwrap_get(slotmap.get(key, [VELOCITY, COLLIDER])) as [Velocity, Collider];
        velocity.x *= 1;
        velocity.y *= 1;
        velocity.z *= 1;

        collider.center.x -= 1;
        collider.center.y -= 1;
        collider.center.z -= 1;

        //Update material partially, immutably
        const [material] = unwrap_get(slotmap.get(key, [MATERIAL])) as [Material];

        const new_material = {alpha: !material.alpha, ...material};
        slotmap.replace(key, [
            [MATERIAL, new_material]
        ]);
        
    }
}

const nativemap_bench_keys = () => {
    //console.log("running nativemap tests for", nativemap.size, "entities");
    for(const key of nativemap.keys()) {

        //TOGGLE IS_ACTIVE IMMUTABLY
        {
            const entity = unwrap_get_native(key, nativemap)
            const { active } = entity;
            nativemap.set(key, {
                ...entity,
                active,
            });
        }

        //UPDATE LOCAL POSITIONS IMMUTABLY
        {
            const entity = unwrap_get_native(key, nativemap)
            const { transform } = entity;
            const { translation: t, rotation: r, scale: s } = transform;

            const translation = {
                x: t.x + 1,
                y: t.y + 1,
                z: t.z + 1,
            }

            const rotation = {
                x: r.x + 1,
                y: r.y + 1,
                z: r.z + 1,
                w: r.w + 1,
            }

            const scale = {
                x: s.x + 1,
                y: s.y + 1,
                z: s.z + 1,
            }


            nativemap.set(key, {
                ...entity,
                transform: {
                    ...transform,
                    translation, rotation, scale,
                },
            });
        }
       
        //UPDATE LOCAL MATRIX IMMUTABLY
        {
            const entity = unwrap_get_native(key, nativemap)
            const { transform } = entity;
            const { translation, rotation, scale } = transform;


            const local_matrix = fromRotationTranslationScale(rotation, translation, scale);

            nativemap.set(key, {
                ...entity,
                transform: {
                    ...transform,
                    localMatrix: local_matrix
                },
            });
        }
        //UPDATE WORLD TRANSFORMS IMMUTABLY
        {
            const entity = unwrap_get_native(key, nativemap)
            const { transform } = entity;
            const local_matrix_2 = transform.localMatrix;
            const worldMatrix = multiply_mat4(local_matrix_2, local_matrix_2);

            nativemap.set(key, {
                ...entity,
                worldMatrix,
            });
        }


        //UPDATE PHYSICS MUTABLY
        {
            const entity = unwrap_get_native(key, nativemap)
            const {velocity, collider} = entity;
            velocity.x *= 1;
            velocity.y *= 1;
            velocity.z *= 1;

            collider.center.x -= 1;
            collider.center.y -= 1;
            collider.center.z -= 1;
        } 

        //Update material partially, immutably
        {
            const entity = unwrap_get_native(key, nativemap)
            const {material} = entity;

            const new_material = {alpha: !material.alpha, ...material};

            nativemap.set(key, {
                ...entity,
                material: new_material,
            });
        }

        
    }
}


const nativemap_bench_values= () => {
    //TOGGLE IS_ACTIVE IMMUTABLY
    for (const [key, entity] of nativemap.entries()) {
        const { active } = simulate_quick_either(entity);
        nativemap.set(key, {
            ...entity,
            active,
        });
    }

    //UPDATE LOCAL POSITIONS IMMUTABLY
    for (const [key, entity] of nativemap.entries()) {
        const {transform} = simulate_quick_either(entity);
        const { translation: t, rotation: r, scale: s } = transform;
        const translation = {
            x: t.x + 1,
            y: t.y + 1,
            z: t.z + 1,
        }

        const rotation = {
            x: r.x + 1,
            y: r.y + 1,
            z: r.z + 1,
            w: r.w + 1,
        }

        const scale = {
            x: s.x + 1,
            y: s.y + 1,
            z: s.z + 1,
        }


        nativemap.set(key, {
            ...entity,
            transform: {
                ...transform,
                translation, rotation, scale
            },
        });
    }

    //UPDATE LOCAL MATRIX IMMUTABLY
    for (const [key, entity] of nativemap.entries()) {
        const { transform } = simulate_quick_either(entity);
        const { translation, rotation, scale } = transform;
        const local_matrix = fromRotationTranslationScale(translation, rotation, scale);

        nativemap.set(key, {
            transform: {
                ...transform,
                localMatrix: local_matrix
            },
            ...entity
        });
    }
       
    //UPDATE WORLD TRANSFORMS IMMUTABLY
    for (const [key, entity] of nativemap.entries()) {
        const { transform } = simulate_quick_either(entity);
        const { localMatrix } = transform;

        const worldMatrix = multiply_mat4(localMatrix, localMatrix);
        nativemap.set(key, {
            worldMatrix,
            ...entity
        });
    }

    //UPDATE PHYSICS MUTABLY
    for (const [key, entity] of nativemap.entries()) {
        const { velocity, collider} = simulate_quick_either(entity);
        velocity.x *= 1;
        velocity.y *= 1;
        velocity.z *= 1;

        collider.center.x -= 1;
        collider.center.y -= 1;
        collider.center.z -= 1;
    }
        //Update material partially, immutably

    for (const [key, entity] of nativemap.entries()) {
        const { material } = simulate_quick_either(entity);

        const new_material = { alpha: !material.alpha, ...material };

        nativemap.set(key, {
            ...entity,
            material: new_material,
        });
    }
}

const suite = new Benchmark.Suite();

suite
    .add("nativemap keys", nativemap_bench_keys)
    .add("slotmap keys", slotmap_bench_keys)
    .add("nativemap values", nativemap_bench_values)
    .add("slotmap values", slotmap_bench_values)
    .on("start", () => {
        if(nativemap.size !== slotmap.length()) {
            throw new Error("internal error - different amount of items!");
        }
        console.log(`running benchmark for ${nativemap.size} entries`);
    })
    .on('cycle', function(event) {
      console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run();
