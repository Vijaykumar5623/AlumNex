                        <th className="border p-2">Verified?</th>
                        <th className="border p-2">Skills (Raw)</th>
                        <th className="border p-2">Skills (Type)</th>
                    </tr >
                </thead >
    <tbody>
        {alumni.map((a) => (
            <tr key={a.id} className={a.role === 'alumni' ? 'bg-blue-50' : ''}>
                <td className="border p-2">{a.role}</td>
                <td className="border p-2">{a.name}</td>
                <td className="border p-2">{a.email}</td>
                <td className="border p-2">{String(a.verified)}</td>
                <td className="border p-2">{JSON.stringify(a.skills)}</td>
                <td className="border p-2">{Array.isArray(a.skills) ? 'Array' : typeof a.skills}</td>
            </tr>
        ))}
    </tbody>
            </table >
        </div >
    )
}
