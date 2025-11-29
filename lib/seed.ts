import { db } from './firebase'
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { faker } from '@faker-js/faker'

export async function seedDatabase() {
    console.log("Starting seed...")
    const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Tesla', 'SpaceX', 'Adobe', 'Salesforce', 'Uber']
    const roles = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'DevOps Engineer']
    const locations = ['Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'San Francisco', 'New York', 'London', 'Remote']

    // 1. Seed Alumni
    try {
        console.log("Seeding Alumni...")
        for (let i = 0; i < 20; i++) {
            const uid = faker.string.uuid()
            const company = faker.helpers.arrayElement(companies)
            const role = faker.helpers.arrayElement(roles)
            const name = faker.person.fullName()

            await setDoc(doc(db, 'profiles', uid), {
                uid: uid,
                email: faker.internet.email(),
                name: name,
                role: 'alumni',
                verified: true,
                company: company,
                jobTitle: role,
                location: faker.helpers.arrayElement(locations),
                graduationYear: faker.number.int({ min: 2015, max: 2023 }),
                skills: faker.helpers.arrayElements(['React', 'Node.js', 'Python', 'Java', 'AWS', 'Design', 'Marketing'], { min: 2, max: 5 }),
                bio: faker.lorem.paragraph(),
                linkedin: `https://linkedin.com/in/${faker.lorem.slug()}`,
                createdAt: new Date().toISOString()
            })

            // 2. Seed Jobs for this Alumni (50% chance)
            if (Math.random() > 0.5) {
                await addDoc(collection(db, 'jobs'), {
                    title: `${role} at ${company}`,
                    company: company,
                    location: faker.helpers.arrayElement(locations),
                    type: faker.helpers.arrayElement(['Full-time', 'Internship']),
                    description: faker.lorem.paragraphs(2),
                    requirements: faker.lorem.lines(3),
                    postedBy: uid,
                    postedAt: new Date().toISOString(),
                    applicationLink: faker.internet.url()
                })
            }
        }
    } catch (e: any) {
        throw new Error(`Failed seeding Alumni/Jobs: ${e.message}`)
    }

    // 3. Seed Students
    try {
        console.log("Seeding Students...")
        for (let i = 0; i < 10; i++) {
            const uid = faker.string.uuid()
            await setDoc(doc(db, 'profiles', uid), {
                uid: uid,
                email: faker.internet.email(),
                name: faker.person.fullName(),
                role: 'student',
                graduationYear: faker.number.int({ min: 2024, max: 2027 }),
                skills: faker.helpers.arrayElements(['HTML', 'CSS', 'JavaScript', 'Python'], { min: 1, max: 3 }),
                bio: faker.lorem.sentence(),
                createdAt: new Date().toISOString()
            })
        }
    } catch (e: any) {
        throw new Error(`Failed seeding Students: ${e.message}`)
    }

    // 4. Seed Success Stories
    try {
        console.log("Seeding Stories...")
        for (let i = 0; i < 10; i++) {
            await addDoc(collection(db, 'stories'), {
                title: faker.lorem.sentence(),
                excerpt: faker.lorem.paragraph(),
                content: faker.lorem.paragraphs(5),
                authorName: faker.person.fullName(),
                authorUid: faker.string.uuid(),
                imageUrl: faker.image.urlLoremFlickr({ category: 'business' }),
                createdAt: faker.date.past().toISOString()
            })
        }
    } catch (e: any) {
        throw new Error(`Failed seeding Stories: ${e.message}`)
    }

    // 5. Seed Forum Topics
    try {
        console.log("Seeding Forums...")
        for (let i = 0; i < 5; i++) {
            await addDoc(collection(db, 'forum_topics'), {
                title: faker.lorem.sentence(),
                category: faker.helpers.arrayElement(['General', 'Careers', 'Tech Talk', 'Events']),
                content: faker.lorem.paragraphs(2),
                authorName: faker.person.fullName(),
                authorUid: faker.string.uuid(),
                createdAt: faker.date.recent().toISOString(),
                replyCount: 0
            })
        }
    } catch (e: any) {
        throw new Error(`Failed seeding Forums: ${e.message}`)
    }

    console.log("Seeding complete!")
}
