const fs = require('fs');
const filepath = 'src/App.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// The damaged target starts at the ") : !hasPaidPlan ? (\n               <div className=\"bg-white rounded-[2rem]"
// and continues up to ") : (n-approve-${g.id}`"

const startIndex = content.indexOf(') : !hasPaidPlan ? (\n               <div className="bg-white rounded-[2rem]');
if (startIndex === -1) {
  console.log("Could not find start index");
  process.exit(1);
}

const endIndex = content.indexOf(') : (n-approve-${g.id}`');
if (endIndex === -1) {
  console.log("Could not find end index");
  process.exit(1);
}

// We want to replace from startIndex of that chunk to endIndex + length of ') : (n-approve-${g.id}`'
const targetEndPhrase = ') : (n-approve-${g.id}`';
const replaceLength = endIndex + targetEndPhrase.length - startIndex;

const replacementText = `) : !hasPaidPlan ? (
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_rgb(0,0,0,0.04)] p-8 max-w-4xl mx-auto mt-6 text-center animate-fade-in relative overflow-hidden">
                  {/* (We will replace this with table markup!) */}
               </div>
             ) : (`;

const tableBody = `  <tr>
                            <th className="px-5 py-3.5">ភ្ញៀវកិត្តិយស</th>
                            <th className="px-5 py-3.5">ទូរស័ព្ទ / ទំនាក់ទំនង</th>
                            <th className="px-5 py-3.5">អ្នករួមដំណើរ (នាក់)</th>
                            <th className="px-5 py-3.5">ប្រាក់ចងដៃ ($)</th>
                            <th className="px-5 py-3.5">កំណត់សម្គាល់</th>
                            <th className="px-5 py-3.5 text-center">ស្ថានភាព</th>
                            <th className="px-5 py-3.5 text-center">ម៉ោងចូលតុ (Check-in)</th>
                            <th className="px-5 py-3.5 text-right">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredGuests.map((g) => (
                            <tr key={g.id} className="hover:bg-rose-50/20 transition duration-150">
                              <td className="px-5 py-4">
                                <span className="font-bold text-slate-800 block text-sm">{g.name}</span>
                                <div className="flex justify-between items-center mt-0.5 gap-2">
                                  <span className="text-[10px] text-slate-400">ID: {g.id.substr(0,8)}</span>
                                </div>
                                {g.province && (
                                  <div className="flex items-center text-[10px] text-slate-500 mt-1 max-w-[200px]" title={[g.address_details, g.village, g.commune, g.district, g.province].filter(Boolean).join(', ')}>
                                    <MapPin className="w-3.5 h-3.5 text-rose-400 mr-0.5 shrink-0" />
                                    <span className="truncate">
                                      {[g.address_details, g.village, g.commune, g.district, g.province].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-mono text-xs block mb-1 text-slate-700">{g.phone}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 inline-block">
                                  {g.relation_type}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center font-bold text-slate-800 text-sm">
                                {g.companions} នាក់
                              </td>
                              <td className="px-5 py-4 text-pink-600 font-bold text-sm whitespace-nowrap">
                                {formatCurrency(g.amount, g.currency)}
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-slate-500 max-w-xs break-words italic line-clamp-2" title={g.note}>
                                  {g.note || '-'}
                                </p>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={\`px-2.5 py-1 rounded-full text-[10px] font-semibold \${
                                  g.status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                }\`}>
                                  {g.status === 'approved' ? 'បានអនុម័ត' : 'រង់ចាំពិនិត្យ'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                {g.is_present ? (
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 shadow-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      ចូលតុរួចរាល់
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 font-semibold">{g.check_in_time}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">មិនទាន់ចូលតុ</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleTogglePresence(g.id, !!g.is_present)}
                                    className={\`py-1 px-2.5 font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-0.5 border \${
                                      g.is_present
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                        : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                                    }\`}
                                    title={g.is_present ? "លុបវត្តមាន" : "កត់ត្រាវត្តមាន (ចូលតុ)"}
                                    id={\`btn-presence-\${g.id}\`}
                                  >
                                    <UserCheck className={\`w-3.5 h-3.5 \${g.is_present ? 'text-slate-450' : 'text-sky-500'}\`} />
                                    <span>{g.is_present ? 'ចាកចេញ' : 'ចូលតុ'}</span>
                                  </button>

                                  {g.status === 'pending' && (
                                    <button
                                      onClick={() => handleApproveGuest(g.id)}
                                      className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-0.5"
                                      title="យល់ព្រម"
                                      id={\`btn-approve-\${g.id}\`}
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>ចុចអនុម័ត</span>
                                    </button>
                                  )}\``;

// Let's replace the whole chunk!
content = content.substring(0, startIndex) + tableBody + content.substring(endIndex + targetEndPhrase.length);
fs.writeFileSync(filepath, content, 'utf8');
console.log("Success!");
