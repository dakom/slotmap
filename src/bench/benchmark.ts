import Benchmark from "benchmark";
import {create_slotmap, SlotMap, MAX_ID} from "../lib/lib";
import {unwrap_get, unwrap_get_native, prep_mock_data, multiply_mat4, fromRotationTranslationScale, Matrix4, Translation, Rotation, Scale, Velocity, Material, Collider, ACTIVE, TRANSLATION, ROTATION, SCALE, LOCAL_MATRIX, WORLD_MATRIX, VELOCITY, MATERIAL, COLLIDER} from "./benchmark-helpers";

/*
 * the idea behind the benchmark is to simulate a real-world situation
 * where data is grouped by entity, and processed according to business-logic
 */

const [slotmap, nativemap] = prep_mock_data();


const slotmap_bench = () => {
    //console.log("running slotmap tests for", slotmap.length(), "entities");
    for(const key of slotmap.keys) {

        //TOGGLE IS_ACTIVE IMMUTABLY
        const [isActive] = unwrap_get(slotmap.get(key, [ACTIVE])) as [boolean];

        slotmap.update(key, [
            [ACTIVE, !isActive]
        ]);

        //UPDATE LOCAL TRANSFORMS IMMUTABLY
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
        
        const local_matrix = fromRotationTranslationScale(rotation, translation, scale);

        slotmap.update(key, [
            [TRANSLATION, translation],
            [ROTATION, rotation],
            [SCALE, scale],
            [LOCAL_MATRIX, local_matrix],
        ]);
       
        //UPDATE WORLD TRANSFORMS IMMUTABLY
        const [local_matrix_2] = unwrap_get(slotmap.get(key, [LOCAL_MATRIX])) as [Matrix4];
        const world_matrix = multiply_mat4(local_matrix_2, local_matrix_2);

        slotmap.update(key, [
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
        slotmap.update(key, [
            [MATERIAL, new_material]
        ]);
        
    }
}

const nativemap_bench = () => {
    //console.log("running nativemap tests for", nativemap.size, "entities");
    for(const key of nativemap.keys()) {

        //TOGGLE IS_ACTIVE IMMUTABLY
        {
            const entity = unwrap_get_native(key, nativemap)
            const { active } = entity;
            nativemap.set(key, {
                active,
                ...entity
            });
        }

        //UPDATE LOCAL TRANSFORMS IMMUTABLY
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

            const local_matrix = fromRotationTranslationScale(rotation, translation, scale);

            nativemap.set(key, {
                transform: {
                    translation, rotation, scale, localMatrix: local_matrix
                },
                ...entity
            });
        }
       
        //UPDATE WORLD TRANSFORMS IMMUTABLY
        {
            const entity = unwrap_get_native(key, nativemap)
            const { transform } = entity;
            const local_matrix_2 = transform.localMatrix;
            const worldMatrix = multiply_mat4(local_matrix_2, local_matrix_2);

            nativemap.set(key, {
                worldMatrix,
                ...entity
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
                material: new_material,
                ...entity
            });
        }

        
    }
}

const suite = new Benchmark.Suite();

suite
    .add("nativemap", nativemap_bench)
    .add("slotmap", slotmap_bench)
    .on('cycle', function(event) {
      console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run();
